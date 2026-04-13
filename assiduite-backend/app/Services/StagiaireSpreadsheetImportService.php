<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use RuntimeException;
use SimpleXMLElement;
use ZipArchive;

class StagiaireSpreadsheetImportService
{
    public function parse(UploadedFile $file): array
    {
        $extension = strtolower($file->getClientOriginalExtension());

        return match ($extension) {
            'xlsx' => $this->parseXlsx($file),
            'csv', 'txt' => $this->parseCsv($file),
            default => throw new RuntimeException('Format de fichier non supporte pour l import.'),
        };
    }

    private function parseCsv(UploadedFile $file): array
    {
        $rows = [];
        $headers = [];
        $handle = fopen($file->getRealPath(), 'rb');

        if ($handle === false) {
            throw new RuntimeException('Impossible de lire le fichier CSV.');
        }

        $firstLine = fgets($handle);

        if ($firstLine === false) {
            fclose($handle);

            return [
                'headers' => [],
                'rows' => [],
            ];
        }

        $delimiter = $this->detectCsvDelimiter($firstLine);
        rewind($handle);

        while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
            if ($headers === []) {
                $headers = $this->sanitizeRow($row);
                continue;
            }

            if ($this->isEmptyRow($row)) {
                continue;
            }

            $rows[] = $this->combineRow($headers, $row);
        }

        fclose($handle);

        return [
            'headers' => $headers,
            'rows' => $rows,
        ];
    }

    private function parseXlsx(UploadedFile $file): array
    {
        $zip = new ZipArchive();

        if ($zip->open($file->getRealPath()) !== true) {
            throw new RuntimeException('Impossible d ouvrir le fichier Excel.');
        }

        $sharedStrings = $this->readSharedStrings($zip);
        $sheetPath = $this->resolveFirstWorksheetPath($zip);
        $sheetXml = $zip->getFromName($sheetPath);

        if ($sheetXml === false) {
            $zip->close();
            throw new RuntimeException('La premiere feuille Excel est introuvable.');
        }

        $sheet = simplexml_load_string($sheetXml);

        if (!$sheet instanceof SimpleXMLElement) {
            $zip->close();
            throw new RuntimeException('Le contenu de la feuille Excel est invalide.');
        }

        $rows = [];
        $headers = [];

        foreach ($sheet->xpath('//*[local-name()="sheetData"]/*[local-name()="row"]') ?: [] as $row) {
            $values = [];

            foreach ($row->xpath('./*[local-name()="c"]') ?: [] as $cell) {
                $reference = (string) ($cell['r'] ?? '');
                $columnIndex = $this->columnReferenceToIndex($reference);
                $values[$columnIndex] = $this->readCellValue($cell, $sharedStrings);
            }

            if ($values === []) {
                continue;
            }

            ksort($values);
            $maxIndex = max(array_keys($values));
            $flattened = [];

            for ($index = 0; $index <= $maxIndex; $index++) {
                $flattened[$index] = $values[$index] ?? '';
            }

            if ($headers === []) {
                $headers = $this->sanitizeRow($flattened);
                continue;
            }

            if ($this->isEmptyRow($flattened)) {
                continue;
            }

            $rows[] = $this->combineRow($headers, $flattened);
        }

        $zip->close();

        return [
            'headers' => $headers,
            'rows' => $rows,
        ];
    }

    private function readSharedStrings(ZipArchive $zip): array
    {
        $xml = $zip->getFromName('xl/sharedStrings.xml');

        if ($xml === false) {
            return [];
        }

        $shared = simplexml_load_string($xml);

        if (!$shared instanceof SimpleXMLElement) {
            return [];
        }

        $strings = [];

        foreach ($shared->xpath('//*[local-name()="si"]') ?: [] as $item) {
            $textNodes = $item->xpath('./*[local-name()="t"]') ?: [];

            if ($textNodes !== []) {
                $strings[] = trim(implode('', array_map(static fn ($node) => (string) $node, $textNodes)));
                continue;
            }

            $parts = [];

            foreach ($item->xpath('./*[local-name()="r"]/*[local-name()="t"]') ?: [] as $text) {
                $parts[] = (string) $text;
            }

            $strings[] = implode('', $parts);
        }

        return $strings;
    }

    private function resolveFirstWorksheetPath(ZipArchive $zip): string
    {
        $relsXml = $zip->getFromName('xl/_rels/workbook.xml.rels');

        if ($relsXml === false) {
            return 'xl/worksheets/sheet1.xml';
        }

        $rels = simplexml_load_string($relsXml);

        if (!$rels instanceof SimpleXMLElement) {
            return 'xl/worksheets/sheet1.xml';
        }

        foreach ($rels->xpath('//*[local-name()="Relationship"]') ?: [] as $relationship) {
            $target = (string) ($relationship['Target'] ?? '');

            if (str_contains($target, 'worksheets/')) {
                return str_starts_with($target, 'xl/')
                    ? $target
                    : 'xl/' . ltrim($target, '/');
            }
        }

        return 'xl/worksheets/sheet1.xml';
    }

    private function readCellValue(SimpleXMLElement $cell, array $sharedStrings): string
    {
        $type = (string) ($cell['t'] ?? '');
        $valueNodes = $cell->xpath('./*[local-name()="v"]') ?: [];
        $value = $valueNodes !== [] ? (string) $valueNodes[0] : '';

        if ($type === 's') {
            $index = (int) $value;

            return isset($sharedStrings[$index]) ? trim((string) $sharedStrings[$index]) : '';
        }

        if ($type === 'inlineStr') {
            $inlineNodes = $cell->xpath('./*[local-name()="is"]/*[local-name()="t"]') ?: [];

            return trim($inlineNodes !== [] ? (string) $inlineNodes[0] : '');
        }

        return trim($value);
    }

    private function columnReferenceToIndex(string $reference): int
    {
        $letters = preg_replace('/[^A-Z]/', '', strtoupper($reference));
        $index = 0;

        foreach (str_split($letters) as $letter) {
            $index = ($index * 26) + (ord($letter) - 64);
        }

        return max(0, $index - 1);
    }

    private function sanitizeRow(array $row): array
    {
        return array_map(
            static fn ($value) => trim((string) $value),
            $row
        );
    }

    private function isEmptyRow(array $row): bool
    {
        foreach ($row as $value) {
            if (trim((string) $value) !== '') {
                return false;
            }
        }

        return true;
    }

    private function combineRow(array $headers, array $row): array
    {
        $result = [];

        foreach ($headers as $index => $header) {
            $result[$header] = isset($row[$index]) ? trim((string) $row[$index]) : null;
        }

        return $result;
    }

    private function detectCsvDelimiter(string $line): string
    {
        $delimiters = [';', ',', "\t"];
        $selected = ';';
        $maxColumns = 0;

        foreach ($delimiters as $delimiter) {
            $columns = count(str_getcsv($line, $delimiter));

            if ($columns > $maxColumns) {
                $maxColumns = $columns;
                $selected = $delimiter;
            }
        }

        return $selected;
    }
}
