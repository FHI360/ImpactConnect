import { useDataEngine, useDataQuery } from '@dhis2/app-runtime';
import React, { useEffect, useState } from 'react';
import { config } from '../consts.js';
import { Navigation } from './Navigation.js';
import { TrackedEntityImporter } from './TrackedEntityImporterComponent.js';


const dataStoreQuery = {
    dataStore: {
        resource: `dataStore/${config.dataStoreName}?fields=.`,
    }
};

const query = {
    programs: {
        resource: `programs`,
        params: {
            fields: ['id', 'displayName', 'programTrackedEntityAttributes(trackedEntityAttribute(id, displayName, valueType, optionSet(id)), mandatory)', 'trackedEntityType'],
            paging: 'false'
        },
    }
}

export const ImportExportComponent = () => {
    const engine = useDataEngine();

    const [program, setProgram] = useState('');
    const [attributes, setAttributes] = useState([]);
    const [trackedEntityType, setTrackedEntityType] = useState('');
    const [attributeData, setAttributeData] = useState([]);
    const [nameAttributes, setNameAttributes] = useState([]);

    const {data: dataStore} = useDataQuery(dataStoreQuery);

    const {data} = useDataQuery(query);

    useEffect(() => {
        if (dataStore?.dataStore?.entries) {
            const entry = dataStore.dataStore.entries.find(e => e.key === `${config.dataStoreKey}`);
            setProgram(entry.value.participantsProgram);
            setNameAttributes(entry.value.nameAttributes);
        }
    }, [dataStore]);

    useEffect(() => {
        if (!data?.programs || !program) {
            return;
        }

        const {programs, programTrackedEntityAttributes, trackedEntityType} = data.programs;
        const selectedProgram = programs?.find(p => p.id === program);
        const attributesList = selectedProgram?.programTrackedEntityAttributes || programTrackedEntityAttributes;
        const trackedEntity = selectedProgram.trackedEntityType || trackedEntityType;

        const attributes = attributesList?.map(attr => ({
            displayName: attr.trackedEntityAttribute.displayName,
            id: attr.trackedEntityAttribute.id,
            valueType: attr.trackedEntityAttribute.valueType,
            optionsId: attr.trackedEntityAttribute.optionSet?.id || null,
            mandatory: attr.mandatory
        }));

        if (attributes) {
            setAttributeData(attributes);
        }

        if (trackedEntity) {
            setTrackedEntityType(trackedEntity.id);
        }
    }, [data, program]);

    useEffect(() => {
        const fetchOptions = async () => {
            // Filter elements that have an `optionsId`
            const elementsWithOptions = attributeData.filter((item) => item.optionsId);

            // Create an array of promises for fetching options
            const optionPromises = elementsWithOptions.map(async (element) => {
                const optionsQuery = {
                    optionSet: {
                        resource: 'optionSets',
                        id: element.optionsId,
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

            // Update the original data with the fetched options
            const updatedData = attributeData.map((item) => {
                const updatedElement = updatedElements.find((el) => el.id === item.id);
                return updatedElement || item;
            });

            setAttributes(updatedData);
        };

        fetchOptions();
    }, [attributeData]);

    return (
        <div className="flex flex-row w-full h-full">
            <div className="page">
                <Navigation/>
                <div className="w-full flex flex-row pt-2">
                    <div className="w-full p-2">
                        <div className="p-6">
                            <TrackedEntityImporter attributesMetadata={attributes} program={program}
                                                   trackedEntityType={trackedEntityType}
                                                   nameAttributes={nameAttributes}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
