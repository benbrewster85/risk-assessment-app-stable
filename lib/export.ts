import { RaEntry } from './types';

// This function safely escapes data for a CSV cell.
// It handles commas and quotes within the data to prevent breaking the CSV format.
function escapeCsvCell(cellData: any): string {
    const stringData = String(cellData === null || cellData === undefined ? '' : cellData);
    if (/[",\n\r]/.test(stringData)) {
        const escapedString = stringData.replace(/"/g, '""');
        return `"${escapedString}"`;
    }
    return stringData;
}

export function convertToCsv(data: RaEntry[]): string {
    // Define the headers for our CSV file
    const headers = [
        "Activity / Task",
        "Hazard",
        "Risk",
        "Who is Affected?",
        "Initial Likelihood",
        "Initial Impact",
        "Initial Risk",
        "Control Measures",
        "Resultant Likelihood",
        "Resultant Impact",
        "Resultant Risk"
    ];

    // Map each entry object to a row of CSV values
    const rows = data.map(entry => {
        const initialRisk = entry.initial_likelihood * entry.initial_impact;
        const resultantRisk = entry.resultant_likelihood * entry.resultant_impact;

        const rowData = [
            escapeCsvCell(entry.task_description),
            escapeCsvCell(entry.hazard?.name),
            escapeCsvCell(entry.risk?.name),
            escapeCsvCell(entry.person_affected),
            entry.initial_likelihood,
            entry.initial_impact,
            initialRisk,
            escapeCsvCell(entry.control_measures),
            entry.resultant_likelihood,
            entry.resultant_impact,
            resultantRisk
        ];
        return rowData.join(',');
    });

    // Combine the header row and all the data rows, separated by new lines
    return [headers.join(','), ...rows].join('\n');
}