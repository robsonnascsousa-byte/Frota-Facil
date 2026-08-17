import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const migrationsDir = fileURLToPath(new URL('../supabase/migrations/', import.meta.url));
const allowedHistoricalFiles = new Set(['20260508_fix_schema_alignment.sql']);
const newOnly = process.argv.includes('--new-only');
const allowDestructiveBaseline = process.argv.includes('--allow-destructive-baseline');
const destructivePattern = /(?:\bDELETE\s+FROM\b|\bTRUNCATE\s+(?!ON\b)(?:TABLE\s+)?(?:public\.)?[a-z_]\w*|\bDROP\s+TABLE\b|\bDROP\s+COLUMN\b)/iu;
const files = (await readdir(migrationsDir)).filter(file => file.endsWith('.sql'));
const failures = [];
const versions = new Map();

for (const file of files) {
    const version = file.match(/^(\d+)_/)?.[1];
    if (version) versions.set(version, [...(versions.get(version) || []), file]);
}
for (const [version, versionFiles] of versions) {
    if (versionFiles.length < 2) continue;
    if (newOnly && Number(version) < 20260817120000) {
        console.warn(`Colisão histórica exige reconciliação do ledger: ${versionFiles.join(', ')}`);
    } else {
        failures.push(`versão ${version}: ${versionFiles.join(', ')}`);
    }
}

for (const file of files) {
    const sql = await readFile(join(migrationsDir, file), 'utf8');
    if (!destructivePattern.test(sql)) continue;
    if (allowedHistoricalFiles.has(file) && newOnly) {
        console.warn(`Ignorando baseline histórica destrutiva em verificação de arquivos novos: ${file}`);
        continue;
    }
    if (allowedHistoricalFiles.has(file) && allowDestructiveBaseline) {
        console.warn(`Override explícito para baseline destrutiva: ${file}`);
        continue;
    }
    failures.push(file);
}

if (failures.length > 0) {
    console.error(`Migrações destrutivas sem aprovação: ${failures.join(', ')}`);
    process.exitCode = 1;
} else {
    console.log('Migrações verificadas: nenhuma operação destrutiva não autorizada encontrada.');
}
