import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dbPath = path.join(process.cwd(), 'krishisetu.db')

declare global {
    var _sqliteDb: any | undefined
}

export function getDb(): any {
    if (!global._sqliteDb) {
        try {
            global._sqliteDb = new Database(dbPath, { fileMustExist: false })
            try {
                global._sqliteDb.pragma('journal_mode = WAL')
            } catch {}
            try {
                global._sqliteDb.pragma('foreign_keys = ON')
            } catch {}
        } catch (err) {
            console.warn('SQLite initialization skipped (Serverless / Read-only environment):', err)
            // Safe fallback stub so calls to db.prepare() won't crash the server
            return {
                prepare: () => ({
                    get: () => null,
                    all: () => [],
                    run: () => ({ changes: 0, lastInsertRowid: 0 })
                }),
                pragma: () => {}
            }
        }
    }
    return global._sqliteDb
}

export const db: any = new Proxy({}, {
    get(_target, prop) {
        const instance = getDb()
        if (instance && typeof instance[prop] === 'function') {
            return instance[prop].bind(instance)
        }
        if (instance && prop in instance) {
            return instance[prop]
        }
        return () => ({ get: () => null, all: () => [], run: () => ({}) })
    }
})
