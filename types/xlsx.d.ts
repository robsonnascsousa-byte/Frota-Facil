declare module 'xlsx' {
    export const utils: {
        json_to_sheet(data: unknown[]): Record<string, unknown>;
        book_new(): Record<string, unknown>;
        book_append_sheet(workbook: unknown, worksheet: unknown, sheetName: string): void;
    };
    export function writeFile(workbook: unknown, filename: string): void;
}
