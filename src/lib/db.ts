import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'krishisetu.db')

declare global {
    // Prevent multiple instances in development hot-reloading
    var _sqliteDb: Database.Database | undefined
}

export function getDb(): Database.Database {
    if (!global._sqliteDb) {
        global._sqliteDb = new Database(dbPath)
        // Enable WAL mode (Write-Ahead Logging) for superior read/write concurrency
        global._sqliteDb.pragma('journal_mode = WAL')
        // Enable foreign keys
        global._sqliteDb.pragma('foreign_keys = ON')
    }
    return global._sqliteDb
}

export const db = getDb()
