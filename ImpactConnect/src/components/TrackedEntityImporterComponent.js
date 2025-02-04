import {useAlert, useDataEngine, useDataQuery} from '@dhis2/app-runtime';
import ExcelJS from 'exceljs';
import {saveAs} from 'file-saver';
import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {LINKED_CELL_COLOR, ORG_UNIT_ID_NAME, TOTAL_ROWS, TRACKED_ENTITY_ID} from '../consts.js';
import {fetchEntities, generateRandomId, trackerCreate} from '../utils.js';

export const TrackedEntityImporter = ({orgUnit, program, trackedEntityType, attributesMetadata, nameAttributes}) => {
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [preparing, setPreparing] = useState(false);
    const [message, setMessage] = useState(null);
    const [rows, setRows] = useState([]);
    const [attributes, setAttributes] = useState({});
    const [headers, setHeaders] = useState({});
    const [errors, setErrors] = useState([]);
    const [orgUnits, setOrgUnits] = useState([]);
    const [programStages, setProgramStages] = useState([]);
    const [programStageData, setProgramStageData] = useState([]);

    const engine = useDataEngine();

    const {show} = useAlert(
        ({msg}) => msg,
        ({type}) => ({[type]: true})
    )
    const {data} = useDataQuery({
        orgUnits: {
            resource: `organisationUnits`,
            params: {
                fields: ['id', 'displayName'],
                paging: 'false',
            }
        }
    });

    useEffect(() => {
        if (data && data.orgUnits) {
            setOrgUnits(data.orgUnits.organisationUnits);
        }
    }, [data]);

    useEffect(() => {
        const fetchOptions = async () => {
            // Filter elements that have an `optionsId`
            const programStages = programStageData.map(ps => ({
                id: ps.id,
                displayName: ps.displayName,
                dataElements: ps.programStageDataElements.flatMap(psde => ({
                    ...psde.dataElement,
                    mandatory: psde.compulsory
                }))
            }));
            const elementsWithOptions = programStages.flatMap(ps => ps.dataElements).filter((item) => item.optionSet?.id);
            // Create an array of promises for fetching options
            const optionPromises = elementsWithOptions.map(async (element) => {
                const optionsQuery = {
                    optionSet: {
                        resource: 'optionSets',
                        id: element.optionSet.id,
                        params: {
                            fields: 'options(code,displayName)',
                        },
                    },
                };

                try {
                    const response = await engine.query(optionsQuery);
                    return {
                        ...element,
                        options: response.optionSet.options,
                    };
                } catch (error) {
                    console.error(`Failed to fetch options for ${element.optionsId}:`, error);
                    return element; // Return the original element if the request fails
                }
            });

            // Execute all promises in parallel
            const updatedElements = await Promise.all(optionPromises);
            const replacementMap = new Map(updatedElements.map(item => [item.id, item]));

            // Iterate through the original list and update the data elements
            const updatedProgramStages = programStages.map(program => ({
                ...program,
                dataElements: program.dataElements.map(de => replacementMap.get(de.id) || de).sort((a, b) => b.compulsory - a.compulsory)
            }));

            setProgramStages((_) => {
                if (updatedProgramStages.length) {
                    setLoaded(true);
                }
                return updatedProgramStages;
            });
        };

        fetchOptions();
    }, [programStageData]);

    useEffect(() => {
        if (program) {
            engine.query({
                programStages: {
                    resource: `programStages`,
                    params: {
                        fields: 'id,displayName,programStageDataElements(compulsory,dataElement(id, displayName, valueType, optionSet(id)))',
                        paging: 'false',
                        filter: `program.id:eq:${program}`,
                    }
                }
            }).then((stages) => {
                setProgramStageData(stages.programStages.programStages)
            })
        }
    }, [program]);

    const autofitColumns = async (worksheet) => {
        worksheet.columns.forEach((column) => {
            let maxLength = 0;

            // Iterate through all cells in the column
            column.eachCell({includeEmpty: true}, (cell) => {
                // Calculate the length of the cell's value
                const columnLength = cell.value ? cell.value.toString().length : 0;

                // Update maxLength if the current cell's length is greater
                if (columnLength > maxLength) {
                    maxLength = columnLength;
                }
            });

            // Add some padding to the column width
            column.width = maxLength < 10 ? 10 : maxLength + 2;
        });
    }

    const updateWorksheet = async (worksheet, columns) => {
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell, colNumber) => {
            const column = columns[colNumber - 1];
            const attributeId = columns[colNumber - 1]?.key;

            if (attributeId) {
                cell.note = `Attribute ID: ${attributeId}`;
            }

            cell.font = {
                bold: true,
                color: {argb: 'FF0000'},
            };
            cell.alignment = {horizontal: 'center', vertical: 'middle'};
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'FFF2CC'},
            };
            cell.border = {
                top: {style: 'thin'},
                left: {style: 'thin'},
                bottom: {style: 'thin'},
                right: {style: 'thin'},
            };

            if (column?.required) {
                // Mark required columns visually
                cell.value += ' *';
            }

            cell.protection = {locked: true};
        });

        // Freeze the header row for better usability
        worksheet.views = [
            {state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A1'},
        ];

        // Protect the worksheet and unlock data cells
        // Enable sheet protection
        worksheet.protect(generateRandomId(), {
            selectLockedCells: true, // Allow selecting locked cells
            selectUnlockedCells: true, // Allow selecting unlocked cells
            formatCells: false, // Prevent formatting cells
            formatColumns: false, // Prevent formatting columns
            formatRows: false, // Prevent formatting rows
            insertColumns: false, // Prevent inserting columns
            insertRows: false, // Prevent inserting rows
            insertHyperlinks: false, // Prevent inserting hyperlinks
            deleteColumns: false, // Prevent deleting columns
            deleteRows: false, // Prevent deleting rows
            sort: false, // Prevent sorting
            autoFilter: false, // Prevent auto-filtering
            pivotTables: false, // Prevent pivot tables
        });

        // Unlock all other cells to allow editing
        for (let i = 2; i <= TOTAL_ROWS; i++) {
            const row = worksheet.getRow(i);
            for (let j = 1; j <= worksheet.columns.length; j++) {
                const cell = row.getCell(j);
                cell.protection = {locked: false};
            }
        }

        await autofitColumns(worksheet);
    }

    const prepareColumns = ({workbook, worksheet, columns, data, colOffset}) => {
        data.forEach((attr, idx) => {
            columns.push({
                header: attr.displayName,
                key: attr.id,
                required: attr.mandatory
            });

            const columnIndex = idx + colOffset;
            if (attr.options && attr.options.length) {
                const metadata = {
                    name: attr.displayName,
                    columnIndex: columnIndex,
                    options: attr.options.map(option => ({label: option.displayName, value: option.code}))
                }
                addSelectOptions({workbook, worksheet, metadata});
            } else if (attr.mandatory && attr.valueType === 'TEXT') {
                addRequiredTextValidation(worksheet, columnIndex, attr.displayName);
            } else if (attr.valueType === 'BOOLEAN' || attr.valueType === 'TRUE_ONLY') {
                addCheckbox({workbook, worksheet, displayName: attr.displayName, columnIndex});
            } else if (attr.valueType.includes('DATE') || attr.valueType === 'AGE') {
                addDateValidation(worksheet, columnIndex);
            } else if (attr.valueType === 'INTEGER_NEGATIVE') {
                addWholeValidation({worksheet, columnIndex, operator: 'lessThanOrEqual', formulae: -1});
            } else if (attr.valueType === 'INTEGER_ZERO_OR_POSITIVE') {
                addWholeValidation({worksheet, columnIndex});
            } else if (attr.valueType === 'INTEGER_POSITIVE') {
                addWholeValidation({worksheet, columnIndex, formulae: 1});
            } else if (attr.valueType === 'NUMBER') {
                addDecimalValidation(worksheet, columnIndex);
            } else if (attr.valueType === 'INTEGER') {
                addIntegerValidation(worksheet, columnIndex);
            } else if (attr.valueType === 'EMAIL') {
                addEmailValidation(worksheet, columnIndex);
            }
        });

        worksheet.columns = columns;

        updateWorksheet(worksheet, columns);
    }

    const downloadExcelTemplate = async () => {
        setPreparing(true);

        await new Promise((resolve) => setTimeout(resolve, 100));

        attributesMetadata = attributesMetadata.sort((a, b) => b.mandatory - a.mandatory);

        nameAttributes = (nameAttributes || []).sort((a, b) => {
            return attributesMetadata.findIndex(attr => attr.id === b) - attributesMetadata.findIndex(attr => attr.id === a);
        });

        const workbook = new ExcelJS.Workbook();

        let colOffset = 2;
        const defaultColumns = [
            {
                header: TRACKED_ENTITY_ID,
                key: 'trackedEntity',
                width: 30,
                required: false
            }
        ];

        if (!orgUnit) {
            defaultColumns.push({
                header: ORG_UNIT_ID_NAME,
                key: 'orgUnit',
                width: 30,
                required: true
            });

            colOffset++;
        }

        let columns = [...defaultColumns];

        const worksheet = workbook.addWorksheet('Template', {
            properties: {tabColor: {argb: 'FFC000'}},
        });
        prepareColumns({workbook, worksheet, columns, colOffset, data: attributesMetadata})

        const linkOffset = colOffset;

        programStages.forEach(ps => {
            const originalOffset = colOffset;
            const worksheet = workbook.addWorksheet(ps.displayName, {
                properties: {tabColor: {argb: 'FFC000'}},
            });
            columns = [...defaultColumns];

            const linkIndex = columns.length + 1;

            if (nameAttributes?.length) {
                nameAttributes.forEach(name => {
                    const index = attributesMetadata.findIndex(attr => attr.id === name);
                    const attribute = attributesMetadata[index];
                    ps.dataElements.unshift(attribute);
                })
            }
            prepareColumns({workbook, worksheet, columns, colOffset: originalOffset, data: ps.dataElements});
            for (let i = 0; i < TOTAL_ROWS; i++) {
                //Link Tracked Entity ID
                workbook.getWorksheet('Template').getCell(`A${i + 2}`).numFmt = '@';
                let cell = worksheet.getCell(`A${i + 2}`);
                let sourceCell = `A${i + 2}`;
                cell.value = {
                    formula: `=IF(Template!${sourceCell}="", "", Template!${sourceCell})`
                };
                cell.protection = {
                    locked: true
                };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: {argb: LINKED_CELL_COLOR},
                };
                cell.border = {
                    top: {style: 'thin', color: {argb: 'FFBFBFBF'}},
                    bottom: {style: 'thin', color: {argb: 'FFBFBFBF'}},
                    left: {style: 'thin', color: {argb: 'FFFFFFFF'}},
                    right: {style: 'thin', color: {argb: 'FFFFFFFF'}}
                };
                workbook.getWorksheet('Template').getCell(`A${i + 2}`).value = '';

                if (!orgUnit) {
                    //Link Org Unit ID
                    sourceCell = `B${i + 2}`;
                    cell = worksheet.getCell(`B${i + 2}`);
                    cell.value = {
                        formula: `=IF(Template!${sourceCell}="", "", Template!${sourceCell})`
                    };
                    cell.protection = {
                        locked: true
                    };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: {argb: LINKED_CELL_COLOR},
                    };
                    cell.border = {
                        top: {style: 'thin', color: {argb: 'FFBFBFBF'}},
                        bottom: {style: 'thin', color: {argb: 'FFBFBFBF'}},
                        left: {style: 'thin', color: {argb: 'FFFFFFFF'}},
                        right: {style: 'thin', color: {argb: 'FFFFFFFF'}}
                    };
                }
                if (nameAttributes?.length) {
                    nameAttributes.forEach((name, idx) => {
                        const reverseIndex = nameAttributes.length - 1 - idx;
                        const index = attributesMetadata.findIndex(attr => attr.id === name);
                        sourceCell = `${cellColumnLetter(linkOffset + index)}${i + 2}`;
                        const linkingCell = `${cellColumnLetter(linkIndex + reverseIndex)}${i + 2}`
                        cell = worksheet.getCell(linkingCell);
                        cell.value = {
                            formula: `=IF(Template!${sourceCell}="", "", Template!${sourceCell})`
                        };
                        cell.protection = {
                            locked: true
                        };
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: {argb: LINKED_CELL_COLOR},
                        };
                        cell.border = {
                            top: {style: 'thin', color: {argb: 'FFBFBFBF'}},
                            bottom: {style: 'thin', color: {argb: 'FFBFBFBF'}},
                            left: {style: 'thin', color: {argb: 'FFFFFFFF'}},
                            right: {style: 'thin', color: {argb: 'FFFFFFFF'}}
                        };
                    });
                }
            }
        });

        // Save the workbook
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), 'Import_Template.xlsx');

        setPreparing(false);
    };

    // Fetch a Tracked Entity Instance by TEID
    const fetchTrackedEntityInstance = async (teid) => {
        return await fetchEntities(engine, [teid], '*');
    };

    // Create a New Tracked Entity Instance
    const createTrackedEntityInstance = async (payload) => {
        const response = await trackerCreate(engine, {
            trackedEntities: payload
        })
        if (!response) {
            throw new Error('Could not save TEIs')
        }
    };

    // Upload Tracked Entity Instances
    const uploadTEIs = async () => {
        if (!program) {
            setMessage('Please select an enrollment program.');
            return;
        }

        setLoading(true);
        setMessage(null);

        const trackedEntities = [];

        const promises = rows.map(async (row) => {
            const teid = row.trackedEntity;

            if (teid) {
                // Fetch the existing TEI
                let existingTEI = await fetchTrackedEntityInstance(teid);
                if (existingTEI && existingTEI.length) {
                    existingTEI = existingTEI[0].entity;
                    console.log(`TEID ${teid} exists. Preparing for update...`);

                    // Build the attributes array for the update
                    const updatedAttributes = Object.keys(row)
                        .filter((key) => attributesMetadata?.map(attr => attr.id).includes(key)) // Use only tracked entity attributes
                        .map((key) => {
                            const valueType = attributesMetadata?.find(attr => attr.id === key)?.valueType;
                            let value = row[key];
                            if (valueType?.includes('DATE') && value) {
                                value = value.toISOString();
                            }
                            return {
                                attribute: key,
                                value
                            }
                        });

                    // Prepare the payload for updating the existing TEI
                    existingTEI.attributes = updatedAttributes;
                    existingTEI.enrollments[0].attributes = updatedAttributes;

                    trackedEntities.push(existingTEI);

                    return; // Continue to the next row
                }
            }

            // If no TEID or not found, create a new TEI
            const newAttributes = Object.keys(row)
                .filter((key) => attributesMetadata.map(attr => attr.id).includes(key)) // Use only tracked entity attributes
                .map((key) => {
                    const valueType = attributesMetadata?.find(attr => attr.id === key)?.valueType;
                    let value = row[key];
                    if (valueType?.includes('DATE') && value) {
                        value = value.toISOString();
                    }
                    return {
                        attribute: key,
                        value
                    }
                });

            const newTEI = {
                trackedEntityType: trackedEntityType,
                orgUnit: row['orgUnit'],
                attributes: newAttributes,
                enrollments: [
                    {
                        program: program,
                        orgUnit: row['orgUnit'],
                        enrolledAt: new Date().toISOString(),
                        occurredAt: new Date().toISOString(),
                        attributes: newAttributes,
                        status: 'ACTIVE'
                    },
                ],
            };

            trackedEntities.push(newTEI); // Add the new TEI to the batch
        });

        try {
            await Promise.all(promises); // Wait for all rows to be processed
            try {
                await createTrackedEntityInstance(trackedEntities);
                setMessage('All TEIs uploaded successfully.');
            } catch (error) {
                console.error('Error uploading TEIs:', error);
                setMessage('An error occurred while uploading TEIs.');
            }
        } catch (error) {
            console.error('Error processing rows:', error);
            setMessage('An error occurred during TEI processing.');
        } finally {
            setLoading(false);
        }
    };

    const excelDateToJSDate = (excelDate) => {
        if (!excelDate) {
            return null;
        }
        // Excel's epoch is January 1, 1900, but it incorrectly considers 1900 a leap year
        // JavaScript's epoch is January 1, 1970
        const epochDifference = 25569; // Days between 1900-01-01 and 1970-01-01
        const millisecondsInDay = 24 * 60 * 60 * 1000; // Number of milliseconds in a day

        // Convert Excel date to JavaScript date
        return new Date((excelDate - epochDifference) * millisecondsInDay);
    };

    const processUploadedExcel = (event) => {
        const file = event.target.files[0];
        setMessage(null);
        setErrors([]);
        setRows([]);
        const reader = new FileReader();

        reader.onload = async (e) => {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(e.target.result);

            const newErrors = [];
            const dataRows = [];

            processSheet({workbook, sheet: 'Template', data: dataRows, errors: newErrors});
            programStages.forEach(ps => {
                processSheet({workbook, sheet: ps.displayName, data: dataRows, errors: newErrors});
            });

            setErrors(newErrors);
            setRows(dataRows);
            if (newErrors.length > 0) {
                setRows([]);
                show({msg: 'Errors found. Please review the error log.', type: 'critical'});
            }
        };

        reader.readAsArrayBuffer(file);
    };

    const processSheet = ({workbook, sheet, data, errors, headers}) => {
        const worksheet = workbook.getWorksheet(sheet);
        if (!worksheet) {
            setMessage('Invalid Excel file. Please use the template.');
            return;
        }

        const headerRow = worksheet.getRow(1);
        const headerMapping = {};
        const attributeMapping = {};

        // Map column indices to headers
        headerRow.eachCell((cell, colNumber) => {
            if (cell.value) {
                headerMapping[colNumber] = cell.value.toString().replace(' *', '');
            }
            if (cell.note?.texts?.[0]?.text.includes('Attribute ID')) {
                const match = cell.note.texts[0].text.match(/Attribute ID: (.+)/);
                if (match) {
                    attributeMapping[colNumber] = match[1];
                }
            }
        });

        setHeaders(headerMapping);
        setAttributes(attributeMapping);

        const requiredColumns = attributesMetadata
            .filter((attr) => attr.mandatory)
            .map((attr) => attr.displayName);

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                const rowData = {};
                const rowErrors = [];

                for (const [colNumber, header] of Object.entries(headerMapping)) {
                    const cell = row.getCell(Number(colNumber));
                    const value = cell.value;
                    const attributeId = attributeMapping[colNumber];
                    let attribute = attributesMetadata.find((attr) => attr.id === attributeId);
                    if (header === TRACKED_ENTITY_ID) {
                        attribute = {
                            valueType: 'TEXT'
                        }
                    }

                    if (header === ORG_UNIT_ID_NAME) {
                        attribute = {
                            valueType: 'TEXT'
                        }
                    }

                    const valueType = attributesMetadata.find(attr => attr.displayName === header)?.valueType || 'TEXT';
                    if (valueType && (valueType !== 'BOOLEAN' || valueType !== 'TRUE_ONLY')) {
                        // Validate required fields
                        if (requiredColumns.includes(header) && (
                            (valueType === 'NUMBER' || valueType === 'INTEGER')
                                ? value === null || value === undefined // Valid only if value is null/undefined for numbers
                                : !value // Valid for other value types
                        )) {
                            rowErrors.push({
                                rowNumber: rowNumber - 1,
                                errorMessage: `Missing value in column "${header}", sheet "${worksheet.name}"`,
                            });
                        }
                    }
                    // Validate Org Unit ID
                    if (header === ORG_UNIT_ID_NAME && value && !orgUnits.some((ou) => ou.id === value)) {
                        rowErrors.push({
                            rowNumber: rowNumber - 1,
                            errorMessage: `Invalid Org Unit ID: "${value}"`,
                        });
                    }

                    if (attribute) {
                        if (attribute.options?.length) {
                            const option = attribute.options.find((opt) => opt.displayName === value);
                            rowData[attributeId] = option ? option.code : null;
                        } else if (attribute.valueType === 'DATE' && value) {
                            rowData[attributeId] = excelDateToJSDate(value);
                        } else if (attribute.valueType === 'BOOLEAN' || attribute.valueType === 'TRUE_ONLY') {
                            rowData[attributeId] = value === 'Yes';
                        } else {
                            rowData[attributeId] = value || '';
                        }
                    }
                }

                if (rowErrors.length) {
                    errors.push(...rowErrors);
                } else {
                    data.push(rowData);
                }
            }
        });
    }

    const addDateValidation = (worksheet, columnIndex) => {
        for (let rowNumber = 2; rowNumber <= TOTAL_ROWS; rowNumber++) {
            const row = worksheet.getRow(rowNumber); // Access the row
            const cell = row.getCell(columnIndex);
            cell.dataValidation = {
                type: 'date',
                operator: 'greaterThanOrEqual',
                showErrorMessage: true,
                allowBlank: true,
                formulae: [new Date(1950, 0, 1)],
                prompt: 'The value must be a date greater or equals to 1/1/1950 in format M/D/YYYY or YYYY/M/D',
                error: 'The value must be a date greater or equals to 1/1/1950 in format M/D/YYYY or YYYY/M/D',
                promptTitle: 'Date'
            };
        }
    }

    const addDecimalValidation = (worksheet, columnIndex) => {
        for (let rowNumber = 2; rowNumber <= TOTAL_ROWS; rowNumber++) {
            const row = worksheet.getRow(rowNumber);
            const cell = row.getCell(columnIndex);
            cell.dataValidation = {
                type: 'decimal',
                showErrorMessage: true,
                allowBlank: true,
                error: 'Enter a number'
            };
        }
    }

    const addIntegerValidation = (worksheet, columnIndex) => {
        for (let rowNumber = 2; rowNumber <= TOTAL_ROWS; rowNumber++) {
            const row = worksheet.getRow(rowNumber);
            const cell = row.getCell(columnIndex);
            cell.dataValidation = {
                type: 'whole',
                showErrorMessage: true,
                allowBlank: true,
                error: 'Enter an integer'
            };
        }
    }

    const addEmailValidation = (worksheet, columnIndex) => {
        for (let rowNumber = 2; rowNumber <= TOTAL_ROWS; rowNumber++) {
            const row = worksheet.getRow(rowNumber);
            const cell = row.getCell(columnIndex);
            const letter = cellColumnLetter(columnIndex);
            cell.dataValidation = {
                type: 'custom',
                showErrorMessage: true,
                allowBlank: true,
                formulae: [`AND(ISNUMBER(FIND("@", ${letter}{rowNumber})), FIND(".", ${letter}{rowNumber}, FIND("@", ${letter}{rowNumber})) > FIND("@", ${letter}{rowNumber}))`],
                error: 'Enter an valid email address'
            };
        }
    }

    const cellColumnLetter = (columnIndex) => {
        // Helper to calculate the Excel column letters (A, B, ..., Z, AA, AB, etc.)
        let columnLetter = '';
        while (columnIndex > 0) {
            const remainder = (columnIndex - 1) % 26;
            columnLetter = String.fromCharCode(65 + remainder) + columnLetter;
            columnIndex = Math.floor((columnIndex - 1) / 26);
        }
        return `${columnLetter}`;
    }

    const addWholeValidation = ({worksheet, columnIndex, operator = 'greaterThanOrEqual', formulae = 0}) => {
        const sign = operator === 'greaterThanOrEqual' ? 'greater' : 'less';
        for (let rowNumber = 2; rowNumber <= TOTAL_ROWS; rowNumber++) {
            const row = worksheet.getRow(rowNumber);
            const cell = row.getCell(columnIndex);
            cell.dataValidation = {
                type: 'whole',
                operator,
                showErrorMessage: true,
                allowBlank: true,
                formulae: [formulae],
                error: `Enter a whole number ${formulae} or ${sign}`
            };
        }
    }

    const addRequiredTextValidation = (worksheet, columnIndex, header) => {

        for (let rowNumber = 2; rowNumber <= TOTAL_ROWS; rowNumber++) {
            const row = worksheet.getRow(rowNumber);
            const cell = row.getCell(columnIndex);
            cell.dataValidation = {
                type: 'textLength',
                operator: 'greaterThan',
                formulae: ['0'],
                showErrorMessage: true,
                errorTitle: 'Required Field',
                error: `This field (${header}) is required.`,
            };
        }
    }

    const addCheckbox = ({workbook, worksheet, displayName, columnIndex}) => {
        const metadata = {
            name: displayName,
            columnIndex: columnIndex,
            options: [
                {
                    label: 'Yes',
                    value: 'Yes'
                },
                {
                    label: 'No',
                    value: 'No'
                }
            ]
        }

        addSelectOptions({workbook, worksheet, metadata});
    }

    const addSelectOptions = ({workbook, worksheet, metadata}) => {
        const sheetName = randomSheetName(10);
        const hiddenSheet = workbook.addWorksheet(sheetName);
        hiddenSheet.state = 'hidden';

        // Add mappings for Gender (Label -> Value)
        hiddenSheet.getCell('A1').value = 'Label';
        hiddenSheet.getCell('B1').value = 'Value';

        //
        metadata.options.forEach((option, idx) => {
            hiddenSheet.getCell(`A${idx + 2}`).value = option.label;
            hiddenSheet.getCell(`B${idx + 2}`).value = option.value;
        });
        for (let rowNumber = 2; rowNumber <= TOTAL_ROWS; rowNumber++) {
            const row = worksheet.getRow(rowNumber); // Access the row
            const cell = row.getCell(metadata.columnIndex);
            cell.dataValidation = {
                type: 'list',
                allowBlank: false,
                formulae: [`=${sheetName}!$A$2:$A$${metadata.options.length + 1}`], // Valid values
                showErrorMessage: true,
                errorTitle: 'Invalid Input',
                error: 'Please select a valid value.',
            };
        }
    }

    const columRequired = (name) => {
        const requiredColumns = attributesMetadata
            .filter((attr) => attr.mandatory)
            .map((attr) => attr.displayName);

        return requiredColumns.includes(name);
    }

    const headerName = (name) => {
        if (name === ORG_UNIT_ID_NAME) {
            return 'Org Unit';
        }
        return name;
    }

    const cellValue = (row, index) => {
        const attribute = attributesMetadata?.find(a => a.id === attributes[index]);
        const valueType = attribute?.valueType;
        const value = row[attributes[index]];

        if (valueType === 'DATE' && value) {
            return new Intl.DateTimeFormat('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }).format(new Date(value));
        }

        if (valueType === 'BOOLEAN' || valueType === 'TRUE_ONLY') {
            return (
                <input
                    type="checkbox"
                    checked={value === 'true' || value === true}
                    readOnly
                />
            );
        }

        if (attribute?.options?.length) {
            return attribute.options.find(option => option.code === value)?.displayName;
        }

        if (attributes[index] === 'orgUnit') {
            return orgUnits.find(ou => ou.id === value)?.displayName;
        }

        return value;
    };

    const randomSheetName = (length) => {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    const handleErrors = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Errors', {properties: {tabColor: {argb: 'FFC000'}}});

        worksheet.columns = [
            {header: 'Row Number', key: 'rowNumber', width: 10},
            {header: 'Error Message', key: 'errorMessage', width: 50},
        ];

        errors.forEach((error) => worksheet.addRow(error));
        worksheet.getRow(1).font = {bold: true};

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), 'Error_Log.xlsx');
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50 rounded-lg shadow-md">
            {errors.length > 0 && (
                <button
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
                    onClick={handleErrors}
                >
                    Download Error Log
                </button>
            )}
            {/* Heading */}
            <h2 className="text-xl font-bold text-gray-800">Upload Tracked Entity Instances</h2>

            {/* Message Display */}
            {message && (
                <div
                    className={`p-4 rounded-md text-sm ${
                        message.includes('error')
                            ? 'bg-red-100 text-red-600 border border-red-300'
                            : 'bg-green-100 text-green-600 border border-green-300'
                    }`}
                >
                    {message}
                </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
                <button
                    className={`px-6 py-2 rounded-md font-medium transition flex items-center gap-2
                        ${(loaded === false || preparing === true) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}
                    `}
                    onClick={downloadExcelTemplate}
                    disabled={loaded === false || preparing === true}
                >
                    {preparing ? (
                        <div className="flex items-center gap-2">
                            <span>Preparing...</span>
                            <span className="animate-bounce">...</span>
                        </div>
                    ) : (
                        'Download Excel Template'
                    )}
                </button>


                {/* File Upload */}
                <div
                    className={`flex flex-col items-center justify-center gap-4 border-2 ${
                        loading
                            ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                            : 'border-dashed border-gray-300 bg-white hover:border-blue-400'
                    } rounded-lg p-6 transition`}
                >
                    <label
                        htmlFor="file-upload"
                        className={`flex flex-col items-center gap-2 ${
                            loading
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'cursor-pointer text-blue-600 hover:text-blue-700'
                        } transition`}
                    >
                        <svg
                            className="w-12 h-12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 16v-8m0 0l-4 4m4-4l4 4M4 16.618a9 9 0 1116 0M4 16.618V18a2 2 0 002 2h12a2 2 0 002-2v-1.382"
                            ></path>
                        </svg>
                        <span className="text-sm font-medium">
                    {loading ? 'Uploading...' : 'Click to upload a file'}
                </span>
                    </label>
                    <input
                        id="file-upload"
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={processUploadedExcel}
                        disabled={loading}
                        className="hidden"
                    />
                    {!loading && (
                        <p className="text-xs text-gray-500">
                            Supported formats: <span className="font-medium">.xlsx, .xls</span>
                        </p>
                    )}
                </div>
            </div>

            {/* Upload Button */}
            <button
                onClick={uploadTEIs}
                className={`px-6 py-2 rounded-md font-medium transition ${
                    rows.length === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                disabled={rows.length === 0 || loading}
            >
                {loading ? (
                    <div className="flex items-center gap-2">
                        <span>Uploading...</span>
                        <span className="animate-bounce">...</span>
                    </div>
                ) : (
                    'Upload TEIs'
                )}
            </button>

            {/* Table */}
            <div className="overflow-x-auto overflow-y-auto max-h-[500px] border border-gray-300 rounded-md bg-white">
                {rows.length > 0 ? (
                    <table className="table-auto min-w-full border-collapse">
                        {/* Table Head */}
                        <thead className="bg-gray-200 sticky top-0 z-10">
                        <tr>
                            {Object.keys(headers).map((idx) => (
                                <th
                                    key={idx}
                                    className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300"
                                >
                                    {headerName(headers[idx])}
                                    {columRequired(headers[idx]) && (
                                        <span className="text-red-500">*</span>
                                    )}
                                </th>
                            ))}
                        </tr>
                        </thead>

                        {/* Table Body */}
                        <tbody>
                        {rows.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className={`${
                                    rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                }`}
                            >
                                {Object.keys(attributes).map((colIndex) => (
                                    <td
                                        key={colIndex}
                                        className="px-4 py-2 border border-gray-300 text-gray-800"
                                    >
                                        {cellValue(row, colIndex)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-4 text-gray-500 text-center">
                        No data to display. Please upload a file to see results.
                    </div>
                )}
            </div>
        </div>
    );
};

TrackedEntityImporter.propTypes = {
    attributesMetadata: PropTypes.array,
    nameAttributes: PropTypes.array,
    orgUnit: PropTypes.string,
    program: PropTypes.string,
    trackedEntityType: PropTypes.string
}
