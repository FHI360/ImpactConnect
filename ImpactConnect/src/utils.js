import React, { createContext, useCallback, useState } from 'react';
import classes from './App.module.css'
import { config, REPORT } from './consts.js';
import padlock from './icons/padlock_resized.jpg';
import refresh from './icons/refresh.png'
import search from './icons/search.png'
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const customImage = (source, size = 'small') => {
    // Check the source and set iconClass accordingly
    let iconClass = '';
    iconClass = size === 'small' ? classes.smallIcon : size === 'large' ? classes.largeIcon : classes.smallIcon;
    if (source.toLowerCase() === 'search') {
        return <img src={search} className={iconClass}/>
    }
    if (source.toLowerCase() === 'refresh') {
        return <img src={refresh} className={iconClass}/>
    }
    if (source.toLowerCase() === '404') {
        return <img
            src={padlock}
            alt="Access Denied"
            className="w-24 h-24 mb-6" // Adjust size as needed
        />
    }
}

export const createOrUpdateDataStore = async (engine, postObject, store, key, mode = '') => {
    if (!postObject.hasOwnProperty('modifiedDate')) {
        // If it doesn't exist, add it to the object
        postObject.modifiedDate = modifiedDate();
    } else {
        // If it exists, update its value
        postObject.modifiedDate = modifiedDate();
    }
    let modeType = ''

    if (mode === 'create') {
        if (!postObject.hasOwnProperty('createdDate')) {
            // If it doesn't exist, add it to the object
            postObject.createdDate = modifiedDate();
        } else {
            // If it exists, update its value
            postObject.createdDate = modifiedDate();
        }
        modeType = true
    } else if (mode === 'update') {
        modeType = false
    }

    try {
        const result = await engine.mutate({
            resource: `dataStore/${store}/${key}`,
            type: modeType ? 'create' : 'update',
            data: postObject,
        });
        return result;
    } catch (error) {
        console.error('Error creating or updating object:', error);
        // throw error;
    }
}

export const createMetadata = async (engine, postObject, mode) => {
    try {
        const result = await engine.mutate({
            resource: 'metadata',
            type: 'create',
            // partial: true,
            data: postObject,
        });
        return {success: true, message: result};
    } catch (error) {
        return {success: false, message: error};
    }
}

export const mergeTrackedEntities = async (engine, payload) => {

    // engine.mutate(trackerMutation, {variables: {payload}})
    console.log('payload is  : ', payload)
    const mode = 'update'
    try {
        const response = await engine.mutate({
            resource: 'tracker',
            type: mode ? 'create' : 'update',
            partial: true,
            // async:false,
            data: payload
        });
        return (response.response.id)


    } catch (error) {
        console.error('trackedEntity error response: ' + error);
        return ('')
    }
}
export const updateTrackedEntityIgnoreAll = async (engine, tei_value, payload, trackedEntityType, selectedMatches) => {
    console.log('payload: ', payload)
    console.log('tei_value:', tei_value)
    console.log('selectedMatches', selectedMatches)
    selectedMatches
    let nestedPayload = {}
    let trackedEntities = []


    payload.forEach(entity => {
        const selectedTei = selectedMatches.some(item => item.id === entity.trackedEntity)
        if (selectedTei) {
            let ignoreAttr = {
                "attribute": "sher1dupli1",
                "displayName": "Ignored duplicate",
                "valueType": "LONG_TEXT"
            }


            const exist = entity.attributes.filter(attr => attr.attribute === "sher1dupli1") || []

            if (exist.length > 0) {
                console.log('entity: ', entity)
                const existIgnoredValues = exist.map(item => item.value);
                const existIgnoredValuesAndNew = `${existIgnoredValues[0]};${tei_value.trackedEntity}`
                // Remove all instances of "sher1dupli1"
                entity.attributes = entity.attributes.filter(attr => attr.attribute !== "sher1dupli1");
                ignoreAttr.value = removeDuplicates(existIgnoredValuesAndNew);
            } else {
                // Remove all instances of "sher1dupli1"
                entity.attributes = entity.attributes.filter(attr => attr.attribute !== "sher1dupli1");
                ignoreAttr.value = tei_value.trackedEntity;
            }
            entity.attributes.push(ignoreAttr)
            entity.trackedEntityType = trackedEntityType
            trackedEntities.push(entity);

        }

    })

    const mapped_trackedEntities = trackedEntities.map(entity => entity.trackedEntity);
    tei_value.attributes.push({
        "attribute": "sher1dupli1",
        "displayName": "Ignored duplicate",
        "valueType": "LONG_TEXT",
        "value": mapped_trackedEntities.join(';')
    })
    const parent_entity = {
        "trackedEntity": tei_value.trackedEntity,
        "orgUnit": tei_value.orgUnit,
        "attributes": tei_value.attributes,
        "trackedEntityType": trackedEntityType
    }
    trackedEntities.push(parent_entity);
    // tei_value, payload
    nestedPayload = {

        "trackedEntities": trackedEntities
    }

    console.log('nestedPayload: ', nestedPayload)
    const mode = 'update'
    try {
        const response = await engine.mutate({
            resource: 'tracker',
            type: mode ? 'create' : 'update',
            partial: true,
            // async:false,
            data: nestedPayload

        });
        console.log('trackedEntity update response:', response);

    } catch (error) {
        // errorMessage(error)
        console.error('trackedEntity error response: ' + error);
    }
    return true
}

export const updateTrackedEntityIgnore = async (engine, teiUpdate, tei_value, payload) => {
    // get the values of the json object
    const ignore_values = Object.values(teiUpdate);
    const trackedEntities = ignore_values.map(item => item.trackedEntity);
    let ignoreAttr = {
        "attribute": "sher1dupli1",
        "displayName": "Ignored duplicate",
        "valueType": "LONG_TEXT",
        "value": trackedEntities.join(';')

    }


    const exist = payload.enrollments[0].attributes.filter(attr => attr.attribute === "sher1dupli1") || []

    if (exist.length > 0) {
        const existIgnoredValues = exist.map(item => item.value);
        console.log('removeDuplicates(existIgnoredValues[0]): ', removeDuplicates(existIgnoredValues[0]))
        const existIgnoredValuesAndNew = `${existIgnoredValues[0]};${tei_value.trackedEntity}`
        ignoreAttr.value = removeDuplicates(existIgnoredValuesAndNew);
    }

    // if (exist.length === 0){
    payload.enrollments[0].attributes.push(ignoreAttr)
    const events = payload?.enrollments[0]?.events || [];

    if ('events' in payload.enrollments[0]) {
        delete payload.enrollments[0].events;
    }

    const nestedPayload = {

        "trackedEntities": [
            {
                "orgUnit": payload.orgUnit,
                "trackedEntity": payload.trackedEntity,
                "trackedEntityType": payload.trackedEntityType,
                "attributes": payload.enrollments[0].attributes,
            }
        ]
    }

    const flatPayload = {
        "trackedEntities": [
            {
                "orgUnit": payload.orgUnit,
                "trackedEntity": payload.trackedEntity,
                "trackedEntityType": payload.trackedEntityType,
                "relationships": payload?.relationships || [],
                "enrollments": payload.enrollments,
                "programOwners": payload.programOwners
            }
        ],

    }
    console.log('nestedPayload: ', nestedPayload)
    const mode = 'update'
    try {
        const response = await engine.mutate({
            resource: 'tracker',
            type: mode ? 'create' : 'update',
            partial: true,
            // async:false,
            data: nestedPayload

        });
        console.log('trackedEntity update response:', response);
    } catch (error) {
        console.error('trackedEntity error response: ' + error);
    }
    // }
}

export const removeDuplicates = (inputString) => {
    // Split the string by ';'
    const array = inputString.split(';');

    // Create a Set to remove duplicates
    const uniqueArray = [...new Set(array)];

    // Join the array back into a string
    return uniqueArray.join(';');
};

export const trackerDelete = async (engine, data) => {
    try {
        await engine.mutate({
            resource: `tracker`,
            type: 'create',
            params: {
                async: false,
                importStrategy: 'delete'
            },
            data
        });
        return true
    } catch (error) {
        return false
    }
}

export const trackerCreate = async (engine, data) => {
    try {
        const response = await engine.mutate({
            resource: 'tracker',
            type: 'create',
            params: {
                async: false
            },
            data
        });
        if (response.status === 'OK') {
            return response.bundleReport.typeReportMap;
        } else {
            return false;
        }
    } catch (e) {
        console.log('Tracker error', e)
        return false;
    }

}

export const generateRandomId = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const idLength = 11;
    let randomId = '';

    for (let i = 0; i < idLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomId += characters.charAt(randomIndex);
    }

    return randomId;
};

export const modifiedDate = () => {
    const now = new Date();

    return now.toISOString();
};

export const provisionOUs = (selectedOU) => {

    const OrgUnitsSelected = selectedOU.map(path => {
        const items = path.split('/');
        return items[items.length - 1];
    });
    return OrgUnitsSelected;
}

export const deleteObjects = async (engine, store, key, obj) => {

    try {
        await engine.mutate({
            resource: `dataStore/${store}/${key}`,
            type: 'delete',
        });
        console.log(`${obj} ${key} deleted`);
        return true
    } catch (error) {
        console.error(`Error deleting ${key}`, error);
        return false
    }
}

export const trimNameToMax50Chars = (name) => {

    const maxNameLength = 50;
    return name.trim().slice(0, maxNameLength);
}

/** for routing and contexting */
export const SharedStateContext = createContext({
    selectedSharedOU: [],
    setSelectedSharedOU: () => {
    },
    selectedSharedProgram: '',
    setSelectedSharedProgram: () => {
    },
    selectedSharedOrgUnit: '',
    setSelectedSharedOrgUnit: () => {
    },
    selectedSharedStage: '',
    setSelectedSharedStage: () => {
    },
    selectedSharedIsAdmin: false,
    setSelectedIsAdmin: () => {
    },
    selectedSharedIsFacilitator: false,
    setSelectedIsFacilitator: () => {
    },
    selectedSharedIsMEL: false,
    setSelectedIsMEL: () => {
    },
    selectedSharedProvince: '',
    setSelectedProvince: () => {
    },
    selectedSharedDistrict: '',
    setSelectedDistrict: () => {
    },
    selectedSharedSector: '',
    setSelectedSector: () => {
    },
    selectedSharedVenue: '',
    setSelectedVenue: () => {
    }
})

export const useSharedState = () => {
    const [selectedSharedOU, setSelectedSharedOU_] = useState([]);
    const [selectedSharedProgram, setSelectedSharedProgram_] = useState('');
    const [selectedSharedOrgUnit, setSelectedSharedOrgUnit_] = useState('');
    const [selectedSharedStage, setSelectedSharedStage_] = useState('');
    const [selectedSharedIsAdmin, setSelectedIsAdmin_] = useState(false);
    const [selectedSharedIsFacilitator, setSelectedIsFacilitator_] = useState(false);
    const [selectedSharedIsMEL, setSelectedIsMEL_] = useState(false);
    const [selectedSharedProvince, setSelectedProvince_] = useState('');
    const [selectedSharedDistrict, setSelectedDistrict_] = useState('');
    const [selectedSharedSector, setSelectedSector_] = useState('');
    const [selectedSharedVenue, setSelectedVenue_] = useState('');


    // memoizedCallbacks
    /**
     * preventing unnecessary re-renders of child components when
     * the callback reference remains unchanged. It optimizes performance by
     * avoiding the recreation of callbacks on each render
     *
     */
    const setSelectedSharedOU = useCallback((data) => {
        setSelectedSharedOU_(data)
    }, []);
    const setSelectedSharedProgram = useCallback((data) => {
        setSelectedSharedProgram_(data)
    }, []);
    const setSelectedSharedOrgUnit = useCallback((data) => {
        setSelectedSharedOrgUnit_(data)
    }, []);
    const setSelectedSharedStage = useCallback((data) => {
        setSelectedSharedStage_(data)
    }, []);
    const setSelectedIsAdmin = useCallback((data) => {
        setSelectedIsAdmin_(data)
    }, []);
    const setSelectedIsFacilitator = useCallback((data) => {
        setSelectedIsFacilitator_(data)
    }, []);
    const setSelectedIsMEL = useCallback((data) => {
        setSelectedIsMEL_(data)
    }, []);
    const setSelectedProvince = useCallback((data) => {
        setSelectedProvince_(data)
    }, []);
    const setSelectedDistrict = useCallback((data) => {
        setSelectedDistrict_(data)
    }, []);
    const setSelectedSector = useCallback((data) => {
        setSelectedSector_(data)
    }, []);
    const setSelectedVenue = useCallback((data) => {
        setSelectedVenue_(data)
    }, []);

    return {
        selectedSharedOU,
        setSelectedSharedOU,
        selectedSharedProgram,
        setSelectedSharedProgram,
        selectedSharedOrgUnit,
        setSelectedSharedOrgUnit,
        selectedSharedStage,
        setSelectedSharedStage,
        selectedSharedIsAdmin,
        setSelectedIsAdmin,
        selectedSharedIsFacilitator,
        setSelectedIsFacilitator,
        selectedSharedIsMEL,
        setSelectedIsMEL,
        selectedSharedProvince,
        setSelectedProvince,
        selectedSharedDistrict,
        setSelectedDistrict,
        selectedSharedSector,
        setSelectedSector,
        selectedSharedVenue,
        setSelectedVenue
    }
}

export const paginate = (array, pageNumber, pageSize) => {
    const startIndex = (pageNumber - 1) * pageSize;
    return array.slice(startIndex, startIndex + pageSize);
}

export const dataStoreQuery = {
    dataStore: {
        resource: `dataStore/${config.dataStoreName}?fields=.`,
    }
};

export const getParticipant = (entity, nameAttributes) => {
    return nameAttributes.map(attr => {
        const attributes = entity.enrollments && entity.enrollments.length > 0 && entity.enrollments[0].attributes || entity.attributes;
        return attributes?.find(attribute => attribute.attribute === attr)?.value
    }).join(' ')
}

export const formatDate = (date) => {
    if (!date) {
        return null;
    }
    return new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
    }).format(new Date(date));
}

export const fetchEntities = (engine, ids, fields) => {
    const fetchEntity = (id) => {
        return engine.query({
            entity: {
                resource: 'tracker/trackedEntities',
                id,
                params: {
                    fields,
                }
            }
        })
    }
    const requests = ids.map(id => fetchEntity(id));
    return Promise.all(requests);
}

export const isObjectEmpty = (objectName) => {
    return Object.keys(objectName).length === 0
}

export const sortEntities = (entities, nameAttributes = []) => {
    return entities.sort((e1, e2) => {
        const attributes1 = e1.enrollments && e1.enrollments.length > 0 && e1.enrollments[0].attributes || e1.attributes;
        const attributes2 = e2.enrollments && e2.enrollments.length > 0 && e2.enrollments[0].attributes || e2.attributes;

        for (let i = 0; i < nameAttributes.length; i++) {
            const attribute = nameAttributes[i];
            const attribute1 = attributes1.find(attr => attr.attribute === attribute)?.value ?? '';
            const attribute2 = attributes2.find(attr => attr.attribute === attribute)?.value ?? '';

            const compare = attribute1.localeCompare(attribute2);
            if (compare !== 0) {
                return compare;
            }
        }

        return 0;
    })
}

export const searchEntities = (keyword = '', entities, nameAttributes = []) => {
    return entities.filter(entity => {
        const attributes = entity.enrollments && entity.enrollments.length > 0 && entity.enrollments[0].attributes || entity.attributes;
        const names = attributes.filter(attr => nameAttributes.includes(attr.attribute))
            .map(attr => attr.value);

        return names.some(name => name.toLowerCase().includes((keyword ?? '').toLowerCase()))
    })
}

export const daysBetween = (startDate, endDate) => {
    if (endDate) {
        const dates = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates.length;
    } else {
        return 1;
    }
}

export const getAttribute = (entity, attribute) => {
    const attributes = entity.enrollments && entity.enrollments.length > 0 && entity.enrollments[0].attributes || entity.attributes;
    return attributes.find(attr => attr.attribute === attribute)?.value
}


export const applyConditionAction = (conditions, stage, dataElement, values, value) => {
    const stageHasRule = (conditions || []).some(condition => condition.selectedStage === stage);
    if (stageHasRule) {
        for (const condition of conditions) {
            if (condition.dataElement_two === dataElement.id) {
                const dataElementOne = condition.dataElement_one || '';
                if (condition.action === 'disable' || condition.action === 'hide' || condition.action === 'show_warning') {
                    if (value && condition.operator === 'equals' && values[dataElementOne] === value ||
                        condition.operator === 'less_than' && values[dataElementOne] < value ||
                        condition.operator === 'greater_than' && values[dataElementOne] > value ||
                        condition.operator === 'is_empty' && !values[dataElementOne]) {
                        return {
                            action: condition.action
                        }
                    }
                }
                if (condition.action === 'mark_invalid') {
                    if (condition.operator === 'is_not_empty' && !value && values[dataElementOne]) {
                        return {
                            action: condition.action
                        }
                    }
                }
            }
        }
    }

    return {
        action: ''
    }
}

export const applyAssignAction = (conditions, stage, dataElement, values) => {
    const stageHasRule = (conditions || []).some(condition => condition.selectedStage === stage);
    if (stageHasRule) {
        for (const condition of conditions) {
            if (condition.dataElement_one === dataElement.id) {
                const dataElementOne = condition.dataElement_two || '';
                if (condition.action === 'assign') {
                    if (condition.operator === 'equals' && (values[dataElementOne] ?? '') + '' === condition.value_text ||
                        condition.operator === 'less_than' && values[dataElementOne] < condition.value_text ||
                        condition.operator === 'greater_than' && values[dataElementOne] > condition.value_text ||
                        condition.operator === 'is_empty' && !values[dataElementOne]) {
                        return {
                            value: condition.value_text
                        }
                    }
                }
            }
        }
    }

    return {
        value: ''
    }
}

export const filterDataValues = (dataElements, dataValues) => {
    if (dataElements && dataElements?.length && dataValues?.length) {
        return dataValues.filter(dv => {
            return dataElements.includes(dv.dataElement) && !!dv.dataElement
        })
    }
    return dataValues;
}


export const prepareAndDownloadAttendance = async (participants, orgUnits, nameAttributes) => {
    /*const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance',
        {
            headerFooter: {
                firstFooter: 'By ticking or marking on the column for photo, video and story consent on this attendance list, I allow FHI360 and/or its partners and/or funders to reproduce, publish and/or otherwise use pictures and/or videos of me and/or my story in print and electronic format.'
            },
            pageSetup: {paperSize: 9, orientation: 'landscape'}
        }
    );
    worksheet.columns = [
        {header: 'NameofParticipant', key: 'name', width: 50},
        {header: 'ParticipantTEID', key: 'teid', width: 50},
        {header: 'Gender', key: 'gender', width: 10},
        //{header: 'Do you have any type of disability? YesNo', key: 'disability', width: 10,},
        {header: 'School', key: 'school', width: 30},
        {header: 'Position', key: 'position', width: 30},
        {header: 'PhoneNumber', key: 'phone', width: 30},
        {header: 'PhotoVideoStory consent', key: 'consent', width: 20},
        {header: 'Signature', key: 'signature', width: 20}
    ];
    const rows = participants.map(participant => {
        return {
            school: orgUnits.find(ou => ou.id === participant.orgUnit)?.displayName,
            name: getParticipant(participant, nameAttributes),
            teid: participant.trackedEntity,
            phone: getAttribute(participant, REPORT.PHONE),
            gender: getAttribute(participant, REPORT.GENDER) === '1' ? 'M' : 'F',
            position: getAttribute(participant, REPORT.POSITION)
        }
    })

    worksheet.addRows(rows);

    const buffer = await workbook.xlsx.writeBuffer();

    // Save the Excel file
    saveAs(new Blob([buffer]), 'Attendance.xlsx');
*/

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance',
        {
            pageSetup: {paperSize: 9, orientation: 'landscape'}
        }
    );
    worksheet.columns = [
        {header: 'Name of Participant', key: 'name', width: 50},
        {header: 'Participant TEID', key: 'teid', width: 50},
        {header: 'Gender', key: 'gender', width: 10},
        {header: 'Do you have any type of disability? Yes/No', key: 'disability', width: 10,},
        {header: 'School', key: 'school', width: 30},
        {header: 'Position', key: 'position', width: 30},
        {header: 'Phone Number', key: 'phone', width: 30},
        {header: 'Photo/Video/Story consent', key: 'consent', width: 20},
        {header: 'Signature', key: 'signature', width: 20}
    ];
    //worksheet.getCell('A2').value = 'Test';
    const rows = participants.map(participant => {
        return {
            school: orgUnits.find(ou => ou.id === participant.orgUnit)?.displayName,
            name: getParticipant(participant, nameAttributes),
            teid: participant.trackedEntity,
            phone: getAttribute(participant, REPORT.PHONE),
            gender: getAttribute(participant, REPORT.GENDER) === '1' ? 'M' : 'F',
            position: getAttribute(participant, REPORT.POSITION)
        }
    })

    worksheet.addRows(rows);

    const buffer = await workbook.xlsx.writeBuffer();

    // Save the Excel file
    saveAs(new Blob([buffer]), 'Attendance.xlsx');
}
