import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { AppError } from '../middleware/error.middleware';

const BACKUP_DIRECTORY = path.resolve(__dirname, '../../backups');

type BackupFileRow = {
  filename: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  downloadUrl: string;
};

const ensureBackupDirectory = async () => {
  await fs.mkdir(BACKUP_DIRECTORY, { recursive: true });
};

const getDatabaseConnection = () => {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new AppError('DATABASE_URL or DIRECT_URL is required to create a backup', 500);
  }

  const url = new URL(connectionString);
  const database = url.pathname.replace(/^\//, '');

  if (!database) {
    throw new AppError('Database name could not be resolved from the connection string', 500);
  }

  return {
    connectionString,
    host: url.hostname,
    port: url.port || '5432',
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    sslmode: url.searchParams.get('sslmode') ?? undefined,
  };
};

const timestampForFilename = () =>
  new Date().toISOString().replace(/[:.]/g, '-');

const getBackupFilePath = (filename: string) => {
  const safeFilename = path.basename(filename);

  if (!safeFilename.endsWith('.dump')) {
    throw new AppError('Invalid backup filename', 400);
  }

  return path.join(BACKUP_DIRECTORY, safeFilename);
};

const mapBackupFile = async (filename: string): Promise<BackupFileRow> => {
  const filePath = getBackupFilePath(filename);
  const stats = await fs.stat(filePath);

  return {
    filename,
    size: stats.size,
    createdAt: stats.birthtime.toISOString(),
    updatedAt: stats.mtime.toISOString(),
    downloadUrl: `/api/backup/download/${filename}`,
  };
};

export const backupService = {
  async createBackup() {
    await ensureBackupDirectory();

    const connection = getDatabaseConnection();
    const filename = `pharmacy-backup-${timestampForFilename()}.dump`;
    const filePath = path.join(BACKUP_DIRECTORY, filename);

    await new Promise<void>((resolve, reject) => {
      const args = ['--format=custom', '--file', filePath];
      const env = {
        ...process.env,
        PGHOST: connection.host,
        PGPORT: connection.port,
        PGUSER: connection.user,
        PGPASSWORD: connection.password,
        PGDATABASE: connection.database,
        ...(connection.sslmode ? { PGSSLMODE: connection.sslmode } : {}),
      };

      const command = spawn('pg_dump', args, { env });
      let stderr = '';

      command.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      command.on('error', (error) => {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          reject(new AppError('pg_dump is not installed on this server', 500));
          return;
        }

        reject(error);
      });

      command.on('close', (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(
          new AppError(
            stderr.trim() || `Database backup failed with exit code ${code ?? 'unknown'}`,
            500
          )
        );
      });
    });

    return mapBackupFile(filename);
  },

  async listBackups() {
    await ensureBackupDirectory();
    const fileNames = await fs.readdir(BACKUP_DIRECTORY);
    const dumpFiles = fileNames.filter((filename) => filename.endsWith('.dump'));
    const rows = await Promise.all(dumpFiles.map((filename) => mapBackupFile(filename)));

    rows.sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    return {
      backups: rows,
      latestBackup: rows[0] ?? null,
      total: rows.length,
    };
  },

  async getBackupFile(filename: string) {
    const filePath = getBackupFilePath(filename);

    try {
      await fs.access(filePath);
    } catch {
      throw new AppError('Backup file not found', 404);
    }

    return {
      filename: path.basename(filename),
      filePath,
    };
  },
};
