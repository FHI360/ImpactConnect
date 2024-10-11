import { useAlert, useDataEngine, useDataQuery } from '@dhis2/app-runtime';
import i18n from '@dhis2/d2-i18n';
import { CalendarInput, Modal, ModalActions, ModalContent, ModalTitle } from '@dhis2/ui';
import classnames from 'classnames';
import React, { useContext, useEffect, useState } from 'react';
import { config, MainTitle } from '../../consts.js';
import { provisionOUs, SharedStateContext } from '../../utils.js';
import { DataElementComponent } from '../DataElement.js';
import { Navigation } from '../Navigation.js';
import OrganisationUnitComponent from '../OrganisationUnitComponent.js';
import ProgramComponent from '../ProgramComponent.js';
import ProgramStageComponent from '../ProgramStageComponent.js';

export const Main = () => {
    const engine = useDataEngine();
    const sharedState = useContext(SharedStateContext)

    const {
        selectedSharedOU,
        setSelectedSharedOU,
        selectedSharedProgram,
        setSelectedSharedProgram,
        selectedSharedOrgUnit,
        setSelectedSharedOrgUnit,
        selectedSharedStage,
        setSelectedSharedStage
    } = sharedState;

    const [selectedOUForQuery, setSelectedOUForQuery] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState(selectedSharedProgram);
    const [selectedStage, setSelectedStage] = useState(selectedSharedStage);
    const [dataElements, setDataElements] = useState([]);
    const [orgUnit, setOrgUnit] = useState(selectedSharedOrgUnit);
    const [events, setEvents] = useState([]);
    const [dates, setDates] = useState([new Date()]);
    const [startDate, setStateDate] = useState(new Date());
    const [endDate, setEndDate] = useState(null);
    const [dateEntities, setDateEntities] = useState({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [entities, setEntities] = useState([]);
    const [allEntities, setAllEntities] = useState([]);
    const [filterValue, setFilterValue] = useState({});
    const [scrollHeight, setScrollHeight] = useState('350px');
    const [selectedOU, setSelectedOU] = useState(selectedSharedOU);
    const [nameAttributes, setNameAttributes] = useState([]);
    const [filterAttributes, setFilterAttributes] = useState([]);
    const [configuredStages, setConfiguredStages] = useState({});
    const [entityAttributes, setEntityAttributes] = useState([]);
    const [attributeOptions, setAttributeOptions] = useState({});
    const [endDateVisible, setEndDateVisible] = useState(false);
    const [groupEdit, setGroupEdit] = useState(false);
    const [edits, setEdits] = useState([]);
    const [originalEdits, setOriginalEdits] = useState([]);
    const [selectedEntities, setSelectedEntities] = useState([]);
    const [repeatable, setRepeatable] = useState(false);
    const [columnDisplay, setColumnDisplay] = useState(false);
    const [groupValues, setGroupValues] = useState({});
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [modalShow, setModalShow] = useState(false);
    const [confirmShow, setConfirmShow] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [attributesFilter, setAttributesFilters] = useState({});

    const {show} = useAlert(
        ({msg}) => msg,
        ({type}) => ({[type]: true})
    )

    const dataStoreQuery = {
        dataStore: {
            resource: `dataStore/${config.dataStoreName}?fields=.`,
        }
    };

    const attributesQuery = {
        attributes: {
            resource: `trackedEntityAttributes`,
            params: ({program}) => ({
                fields: ['id', 'displayName', 'optionSet(id)', 'valueType'],
                paging: 'false',
                program: program
            }),
        }
    }

    const eventQuery = {
        events: {
            resource: 'tracker/events',
            params: ({program, programStage, start, end}) => {
                start.setUTCHours(0, 0, 0, 0);
                end.setUTCHours(23, 59, 59, 999);
                return ({
                    program: program,
                    programStage: programStage,
                    occurredAfter: start,
                    occurredBefore: end,
                    fields: ['id', 'displayName', 'occurredAt', 'dataElement(id, name)'],
                })
            }
        }
    }

    const dataElementsQuery = {
        programStage: {
            resource: `programStages`,
            id: ({id}) => id,
            params: ({
                fields: 'repeatable, programStageDataElements(dataElement(id, name, valueType, optionSet(id))'
            })
        }
    }

    const entitiesQuery = {
        entities: {
            resource: 'tracker/trackedEntities',
            params: ({orgUnit, program, page, pageSize}) => {
                return ({
                    program: program,
                    orgUnit: orgUnit,
                    pageSize: pageSize,
                    page: page,
                    paging: true,
                    fields: ['*'],
                })
            }
        }
    }

    const {data: dataEvent} = useDataQuery(eventQuery, {
        variables: {
            program: selectedProgram,
            programStage: selectedProgram,
            start: startDate,
            end: endDate,
        }
    });

    const {data: entityData, refetch} = useDataQuery(entitiesQuery, {
        variables: {
            program: selectedProgram,
            orgUnit: orgUnit,
            page,
            pageSize
        }
    });

    const {
        data: elementsData,
        refetch: refetchDataElements
    } = useDataQuery(dataElementsQuery, {variables: {id: selectedStage}});

    const {data: dataStore} = useDataQuery(dataStoreQuery);

    const {
        data: attributesData,
        refetch: attributesRefetch
    } = useDataQuery(attributesQuery, {variables: {program: selectedProgram}});

    useEffect(() => {
        if (dataStore?.dataStore?.entries) {
            const entry = dataStore.dataStore.entries.find(e => e.key === selectedProgram);
            if (entry) {
                setNameAttributes(entry.value.nameAttributes || []);
                setFilterAttributes(entry.value.filterAttributes || []);
                setConfiguredStages(entry.value.configuredStages || {});
                setEndDateVisible(entry.value.endDateVisible);
                setColumnDisplay(entry.value.columnDisplay);
                setGroupEdit(entry.value.groupEdit);
            }
        }
    }, [dataStore, selectedProgram]);

    useEffect(() => {

        setSelectedOUForQuery(provisionOUs(selectedOU))

    }, [selectedOU]);

    useEffect(() => {
        if (dataEvent && dataEvent.events) {
            setEvents(dataEvent.events);
            const dates = [];
            dataEvent.events.forEach(event => {
                dates.push(event.occurredAt);
            });

            setDates(dates);
        }

    }, [dataEvent, startDate, endDate, selectedStage, selectedProgram]);

    useEffect(() => {
        refetchDataElements({id: selectedStage});
        if (elementsData && elementsData.programStage && elementsData.programStage.programStageDataElements) {
            const dataElements = elementsData.programStage.programStageDataElements.map(data => data.dataElement);
            setDataElements(dataElements);
            setRepeatable(elementsData.programStage.repeatable);
        }
        setOriginalEdits([]);
        setEdits([]);
    }, [elementsData, selectedStage]);

    useEffect(() => {
        if (entityData && entityData.entities) {
            setAllEntities(entityData.entities.instances);
            if (filterValue && Object.keys(filterValue).length) {
                Object.keys(filterValue).forEach(key => {
                    const entities = entityData.entities.instances.filter(entity => {
                        const attribute = entity.attributes.find(attr => attr.attribute === key);
                        return attribute && attribute.value + '' === filterValue[key] + '';
                    });

                    setEntities(entities);
                })
            } else {
                setEntities(entityData.entities.instances);
            }
        } else {
            setEntities([])
        }
    }, [orgUnit, selectedProgram, entityData, page, pageSize]);

    useEffect(() => {
        setPage(1);
        refetch({page: 1, pageSize: pageSize, program: selectedProgram, orgUnit: orgUnit});
    }, [orgUnit, selectedProgram, pageSize, page])

    useEffect(() => {
        const adjustScrollHeight = () => {
            const height = window.innerHeight;
            if (height < 800) {
                setScrollHeight('350px');
            } else {
                setScrollHeight('700px');
            }
        };

        // Adjust scrollHeight initially
        adjustScrollHeight();

        // Add event listener to adjust on resize
        window.addEventListener('resize', adjustScrollHeight);

        // Clean up event listener on component unmount
        return () => {
            window.removeEventListener('resize', adjustScrollHeight);
        };
    }, []);

    useEffect(() => {
        attributesRefetch({program: selectedProgram})
        if (attributesData?.attributes?.trackedEntityAttributes) {
            setEntityAttributes(attributesData?.attributes?.trackedEntityAttributes)
        }
    }, [attributesData, selectedProgram])

    /***
     * Org Units Selection Function. Responsible populating OrgUnitsSelected with selected OrgUnits
     *
     */
    const handleOUChange = event => {
        setOrgUnit(event.id);
        setSelectedSharedOrgUnit(event.id);
        setSelectedOU(event.selected);
        setSelectedSharedOU(event.selected)
        if (!event.checked) {
            setSelectedSharedOrgUnit('')
        }
    };

    const dataStoreOperation = (type, data) => {
        const value = {
            nameAttributes,
            filterAttributes,
            configuredStages,
            endDateVisible,
            groupEdit,
            columnDisplay
        }
        value[type] = data;
        const mutation = {
            resource: `dataStore/${config.dataStoreName}/${selectedProgram}`,
            type: 'update',
            data: value
        }
        engine.mutate(mutation).then(_ => {
            show({msg: i18n.t('Event successfully saved'), type: 'success'});
        });
    }

    const handleProgramChange = (event) => {
        setSelectedProgram(event);
        setSelectedSharedProgram(event);
    }

    const stateDateChanged = event => {
        const startDate = new Date(event.calendarDateString)
        setStateDate(startDate);
        calculateDatesBetween(startDate, endDate);
    }

    const endDateChanged = event => {
        const endDate = new Date(event.calendarDateString);
        setEndDate(endDate)
        calculateDatesBetween(startDate, endDate);
    }

    const filterEntities = (filterAttr, value) => {
        const filterAttributes = filterValue;
        filterAttributes[filterAttr] = value;
        setFilterValue(filterAttributes);

        if (value && (value + '').length > 0) {
            const entities = allEntities.filter(entity => {
                const attribute = entity.attributes.find(attr => attr.attribute === filterAttr);
                return attribute && attribute.value + '' === value + '';
            });

            setEntities(entities);
        } else {
            setEntities(allEntities)
        }
    }

    const calculateDatesBetween = (startDate, endDate) => {
        if (endDateVisible) {
            const dates = [];
            const currentDate = new Date(startDate);

            while (currentDate <= endDate) {
                dates.push(new Date(currentDate));
                currentDate.setDate(currentDate.getDate() + 1);
            }
            setDates(dates);
        } else {
            setDates([startDate])
        }
    }

    const datesBetween = (startDate, endDate) => {
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

    const formatDate = (date) => {
        if (!date) {
            return null;
        }
        return new Intl.DateTimeFormat('en-GB', {
            dateStyle: 'medium',
        }).format(new Date(date));
    }

    const getParticipant = (entity) => {
        return nameAttributes.map(attr => {
            return entity.enrollments[0].attributes?.find(attribute => attribute.attribute === attr)?.value
        }).join(' ')
    }

    const groupDataElementValue = (dataElement) => {
        return groupValues[dataElement];
    }

    const dataElementValue = (date, dataElement, entity) => {
        let event = entity.enrollments[0].events?.find(event => event.programStage === selectedStage
            && formatDate(event.occurredAt) === formatDate(date.toISOString()));
        const activeEvent = entity.enrollments[0].events?.find(event => event.programStage === selectedStage);
        const editedEntity = edits.find(edit => edit.entity.trackedEntity === entity.trackedEntity);

        if (activeEvent && !repeatable) {
            event = activeEvent;
        }
        if (event) {
            let value;
            if (editedEntity && editedEntity.values.some(v => formatDate(v.date) === formatDate(date) && v.dataElement.id === dataElement)) {
                value = editedEntity.values.find(value => value.dataElement.id === dataElement && formatDate(date) === formatDate(value.date))?.value;
            } else {
                value = event.dataValues.find(dv => dv.dataElement === dataElement)?.value;
            }
            return (value ?? '') + '';

        } else if (editedEntity) {
            return (editedEntity.values.find(value => value.dataElement.id === dataElement && formatDate(date) === formatDate(value.date))?.value ?? '') + '';
        }
        return null;
    }

    const selectDate = (date, checked) => {
        const dates = dateEntities;
        if (checked) {
            dates[date] = entities.map(e => e.trackedEntity);
        } else {
            dates[date] = [];
        }

        setDateEntities(dates);
    }

    const dateChecked = (entity, date) => {
        return dateEntities[date]?.includes(entity.trackedEntity)
    }

    const checkEntity = (entity, date, checked) => {
        const dates = dateEntities;
        let entities = dateEntities[date];
        if (checked) {
            entities.push(entity.trackedEntity);
        } else {
            entities = entities.filter(e => e.trackedEntity !== entity.trackedEntity);
        }
        dates[date] = entities;
        setDateEntities(dates);
    }

    const saveEdits = () => {
        const events = [];

        const filterValues = (values, formattedDate) => {
            return values.filter(value => formatDate(value.date) === formattedDate);
        }

        const _edits = edits;
        //If group action and an entity has been selected and not edited, add it here
        if (groupEdit) {
            selectedEntities.forEach(entity => {
                if (!edits.find(edit => edit.entity.trackedEntity === entity.trackedEntity)) {
                    _edits.push({
                            entity,
                            values: [{
                                date: startDate
                            }]
                        }
                    );
                }
            })
        }
        //Loop through each edit records and recreate event data for
        console.log('Edits')
        _edits.forEach(edit => {
            Map.groupBy(edit.values, ({date}) => formatDate(date)).keys().forEach(eventDate => {
                let event = edit.entity?.enrollments[0].events?.find(event => event.programStage === selectedStage &&
                    formatDate(event.occurredAt) === eventDate);
                const values = filterValues(edit.values, eventDate);
                console.log('Edit', edit, event)
                if (!event) {
                    const existingEvent = edit.entity.enrollments[0].events?.find(event => event.programStage === selectedStage);
                    if (existingEvent && !repeatable) {
                        event = existingEvent;
                    } else {
                        event = {
                            programStage: selectedStage,
                            enrollment: edit.entity.enrollments[0].enrollment,
                            trackedEntity: edit.entity.trackedEntity,
                            orgUnit: edit.entity.orgUnit,
                            occurredAt: values[0].date.toISOString(),
                            dataValues: []
                        }
                    }
                }

                values.forEach(value => {
                    if (value.dataElement) {
                        const dataValue = event.dataValues.find(dv => dv.dataElement === value.dataElement.id) || {};
                        dataValue.dataElement = value.dataElement.id;
                        dataValue.value = (value.value ?? '') + '';
                        if (value.dataElement.valueType === 'TRUE_ONLY' && !value.value) {
                            dataValue.value = null;
                        }
                        if (value.dataElement.valueType.includes('DATE')) {
                            dataValue.value = value.value ? new Date(value.value).toISOString() : '';
                        }

                        const dataValues = event.dataValues.filter(dv => dv.dataElement !== value.dataElement.id) || [];
                        dataValues.push(dataValue);
                        event.dataValues = dataValues;
                    }
                });

                (configuredStages[selectedStage]['groupDataElements'] || []).map(de => {
                    return {
                        dataElement: de,
                        value: groupDataElementValue(de)
                    }
                }).forEach(de => {
                    const dataValue = event.dataValues.find(dv => dv.dataElement === de.dataElement) || {};
                    dataValue.dataElement = de.dataElement;
                    dataValue.value = (de.value ?? '') + '';
                    const valueType = dataElements.find(d => d.id === de.dataElement)?.valueType ?? '';
                    if (valueType === 'TRUE_ONLY' && !de.value) {
                        dataValue.value = null;
                    }
                    if (valueType.includes('DATE')) {
                        dataValue.value = de.value ? new Date(de.value).toISOString() : '';
                    }

                    const dataValues = event.dataValues.filter(dv => dv.dataElement !== de.dataElement) || [];
                    dataValues.push(dataValue);
                    event.dataValues = dataValues;
                })

                events.push(event);
            });
        });

        engine.mutate({
            resource: 'tracker',
            type: 'create',
            params: {
                async: false
            },
            data: {
                events
            }
        }).then((response) => {
            if (response.status === 'OK') {
                setEdits([]);
                refetch({
                    program: selectedProgram,
                    orgUnit: orgUnit,
                    page,
                    pageSize
                });
                show({msg: i18n.t('Data successfully updated'), type: 'success'});
            } else {
                show({msg: i18n.t('There was an error updating records'), type: 'error'});
            }
        });
    }

    // eslint-disable-next-line max-params
    const createOrUpdateEvent = (entity, date, dataElement, value) => {
        if (dataElement.valueType.includes('INTEGER')) {
            value = parseInt(value);
            if (dataElement.valueType === 'INTEGER_ZERO_OR_POSITIVE' && parseInt(value) < 0) {
                alert('Please enter a non-negative integer');
                return;
            }
            if (dataElement.valueType === 'INTEGER_POSITIVE' && parseInt(value) <= 0) {
                alert('Please enter a number greater than 0');
                return;
            }
            if (dataElement.valueType === 'INTEGER_NEGATIVE' && parseInt(value) >= 0) {
                alert('Please enter a number less than 0');
                return;
            }
        }
        const _edits = edits.filter(edit => edit.entity.trackedEntity !== entity.trackedEntity);
        let currentEdit = edits.find(edit => edit.entity.trackedEntity === entity.trackedEntity);
        const originalEdit = originalEdits.find(edit => edit.entity.trackedEntity === entity.trackedEntity);
        if (!currentEdit) {
            currentEdit = {
                entity,
                values: []
            };
        }
        const values = currentEdit.values.filter(v => !(v.dataElement.id === dataElement.id && formatDate(date) === formatDate(v.date)));
        values.push({
            value,
            dataElement,
            date
        });
        currentEdit.values = values;

        const values2 = [...values];
        const values1 = [...(Object.assign({}, originalEdits.find(edit => edit.entity.trackedEntity === entity.trackedEntity))?.values ?? [])];
        const editChanged = () => {
            if (values2.length !== values1.length) {
                return true;
            }
            return values1.some(value => {
                const match = values2.find(v => v.dataElement.id === value.dataElement.id && formatDate(v.date) === formatDate(value.date));
                if (!match) {
                    return true;
                }
                if (value.dataElement.valueType === 'TRUE_ONLY' || value.dataElement.valueType === 'BOOLEAN') {
                    return !match.value !== !value.value;
                }
                return ((match.value ?? '') + '') !== ((value.value ?? '') + '');

            })
        }

        if (originalEdit?.entity.trackedEntity !== currentEdit.entity.trackedEntity || editChanged()) {
            _edits.push(currentEdit);

            if (!originalEdit) {
                setOriginalEdits([...originalEdits, {...currentEdit}]);
            } else {
                const _originalEdits = originalEdits.filter(edit => edit.entity.trackedEntity !== entity.trackedEntity);
                const oldValues = {...originalEdit}.values.filter(v => v.dataElement.id === dataElement.id && formatDate(v.date) === formatDate(date));
                const newValues = currentEdit.values.filter(v => !(v.dataElement.id === dataElement.id && formatDate(v.date) === formatDate(date)));
                oldValues.push(...newValues);
                setOriginalEdits([..._originalEdits, Object.assign({}, originalEdit, {values: oldValues})]);
            }
        }

        setEdits(_edits);
    }

    const createOrUpdateGroupEvent = (dataElement, value) => {
        const values = groupValues;
        values[dataElement.id] = value;
        setGroupValues(values);
    }

    const createOrUpdateIndividualEvent = (entity, dataElement, value) => {
        createOrUpdateEvent(entity, startDate, dataElement, value);
    }

    const individualDataElementsForDates = () => {
        const configuredDataElements = [];
        switch (datesBetween(startDate, endDate)) {
            case 1:
                configuredDataElements.push('xC0qvYXW3kB');
                break;
            case 2:
                configuredDataElements.push(...['xC0qvYXW3kB', 'NOA57B7ry6m']);
                break;
            case 3:
                configuredDataElements.push(...['xC0qvYXW3kB', 'NOA57B7ry6m', 'wnlNJ6YXPEB']);
                break;
            case 4:
                configuredDataElements.push(...['xC0qvYXW3kB', 'NOA57B7ry6m', 'wnlNJ6YXPEB', 'wiy7OJe82vw']);
                break;
            case 5:
                configuredDataElements.push(...['xC0qvYXW3kB', 'NOA57B7ry6m', 'wnlNJ6YXPEB', 'wiy7OJe82vw', 'Zl2C1J82Iko']);
                break;
            case 6:
                configuredDataElements.push(...['xC0qvYXW3kB', 'NOA57B7ry6m', 'wnlNJ6YXPEB', 'wiy7OJe82vw', 'Zl2C1J82Iko', 'swP5ko96SyC']);
                break;
            case 7:
                configuredDataElements.push(...['xC0qvYXW3kB', 'NOA57B7ry6m', 'wnlNJ6YXPEB', 'wiy7OJe82vw', 'Zl2C1J82Iko', 'swP5ko96SyC', 'pb3dozumaA9']);
                break;
            case 8:
                configuredDataElements.push(...['xC0qvYXW3kB', 'NOA57B7ry6m', 'wnlNJ6YXPEB', 'wiy7OJe82vw', 'Zl2C1J82Iko', 'swP5ko96SyC', 'pb3dozumaA9', 'nz0xDT9pdgw']);
                break;
            case 9:
                configuredDataElements.push(...['xC0qvYXW3kB', 'NOA57B7ry6m', 'wnlNJ6YXPEB', 'wiy7OJe82vw', 'Zl2C1J82Iko', 'swP5ko96SyC', 'pb3dozumaA9', 'nz0xDT9pdgw', 'SdP4s8SRDX1']);
                break;
            case 10:
                configuredDataElements.push(...['xC0qvYXW3kB', 'NOA57B7ry6m', 'wnlNJ6YXPEB', 'wiy7OJe82vw', 'Zl2C1J82Iko', 'swP5ko96SyC', 'pb3dozumaA9', 'nz0xDT9pdgw', 'SdP4s8SRDX1', 'aX5CYDBVHBF']);
                break;
        }

        return configuredDataElements;
    }

    const saveGroupTemplate = () => {
        const template = {
            startDate,
            endDate,
            dataElements: (configuredStages[selectedStage]['dataElements'] || []).map(de => {
                return {
                    dataElement: de,
                    value: groupDataElementValue(de)
                }
            })
        };

        configuredStages[selectedStage]['templates'] = configuredStages[selectedStage]['templates'] || {};
        configuredStages[selectedStage]['templates'][templateName] = template;
        setConfiguredStages(configuredStages);
        setTemplateName('');

        dataStoreOperation('configuredStages', configuredStages);
    }

    const handleTemplateChange = (name) => {
        setSelectedTemplate(name);
        const template = configuredStages[selectedStage]['templates'][name];
        if (template) {
            setStateDate(new Date(template['startDate']));
            setEndDate(new Date(template['endDate']));
            const values = groupValues;
            (template['dataElements'] || []).forEach(de => {
                values[de.dataElement] = de.value;
            })

            setGroupValues(values);
        }
    }

    return (
        <>
            <div className="flex flex-row w-full h-full">
                <div
                    className="w-2/12 bg-[#f8f4f3] p-4 z-50 transition-transform">
                    <a href="#" className="flex items-center pb-4 border-b border-b-gray-800">

                        <h2 className="font-bold text-2xl">{MainTitle}</h2>
                    </a>
                    <OrganisationUnitComponent
                        handleOUChange={handleOUChange}
                        selectedOU={selectedOU}
                    />
                </div>
                <div className="w-10/12 ml-4 mr-4 p-4 bg-gray-100 min-h-screen transition-all rounded-md">
                    <Navigation/>
                    <div className="p-6">
                        <div className="mx-auto w-full">
                            <div className="w-full">
                                <div className="flex flex-col">
                                    <div className="flex flex-col gap-1 mb-2">
                                        <div className="flex flex-row w-full rounded-md bg-white p-3 gap-x-1">
                                            <div className="w-3/12">
                                                <ProgramComponent
                                                    selectedProgram={selectedProgram}
                                                    setSelectedProgram={handleProgramChange}
                                                    disabled={!selectedSharedOrgUnit}
                                                />
                                            </div>
                                            <div className="w-3/12">
                                                <ProgramStageComponent
                                                    selectedProgram={selectedProgram}
                                                    selectedStage={selectedStage}
                                                    setSelectedStage={(stage) => {
                                                        setSelectedStage(stage)
                                                        setSelectedSharedStage(stage)
                                                    }
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {Object.keys(filterAttributes).length > 0 &&
                                        <div className="rounded-md bg-white p-3 mb-2 w-full gap-x-1">
                                            <label htmlFor="stage"
                                                   className="block mb-2 text-sm font-medium text-gray-900 dark:text-white border-b-2 border-b-gray-800">
                                                {i18n.t('Entity Filter')}
                                            </label>
                                            <div className="p-2 flex flex-row flex-wrap">
                                                {filterAttributes.map((attr, idx) => {
                                                    const entityAttribute = entityAttributes.find(ea => ea.id === attr);
                                                    if (entityAttribute) {
                                                        return <>
                                                            <DataElementComponent key={idx}
                                                                                  dataElement={attr}
                                                                                  labelVisible={true}
                                                                                  value={filterValue[attr]}
                                                                                  label={entityAttributes.find(a => a.id === attr)?.displayName}
                                                                                  valueChanged={(_, v) => filterEntities(attr, v)}/>
                                                        </>
                                                    }
                                                })}
                                            </div>
                                        </div>
                                    }
                                    {selectedStage &&
                                        <div className="flex flex-col w-full mb-2">
                                            <div className="w-full rounded-md bg-white p-3 flex flex-row gap-x-1">
                                                <div className="w-3/12 flex flex-col">
                                                    <label
                                                        className="text-left block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                        {((endDateVisible && repeatable) || groupEdit) ? 'Event Start Date' : 'Event Date'}
                                                    </label>
                                                    <CalendarInput
                                                        label=""
                                                        calendar="gregory"
                                                        date={startDate && startDate.toISOString ? startDate?.toISOString().slice(0, 10) : ''}
                                                        onDateSelect={stateDateChanged}
                                                    />
                                                </div>
                                                {((endDateVisible && repeatable) || groupEdit) &&
                                                    <div className="w-3/12 flex flex-col">
                                                        <label
                                                            className="text-left block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                            {'Event End Date'}
                                                        </label>
                                                        <CalendarInput
                                                            label=""
                                                            calendar="gregory"
                                                            date={endDate && endDate.toISOString ? endDate?.toISOString().slice(0, 10) : ''}
                                                            max={new Date().toISOString().slice(0, 10)}
                                                            onDateSelect={endDateChanged}
                                                        />
                                                    </div>
                                                }
                                            </div>
                                            {groupEdit && (selectedStage || groupValues) && dataElements.length > 0 && (configuredStages[selectedStage]['groupDataElements'] || []).length > 0 &&
                                                <div className="w-full flex flex-col pt-2">
                                                    <div className="p-8 mt-6 lg:mt-0 rounded shadow bg-white">
                                                        {configuredStages[selectedStage] && Object.keys(configuredStages[selectedStage]['templates'] || {}).length > 0 &&
                                                            <div className="w-3/12">
                                                                <label htmlFor="stage"
                                                                       className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                                    {i18n.t('Select Saved Event')}
                                                                </label>
                                                                <select id="stage"
                                                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                                                        value={selectedTemplate}
                                                                        onChange={(event) => handleTemplateChange(event.target.value)}>
                                                                    <option selected>Choose event</option>
                                                                    {Object.keys(configuredStages[selectedStage]['templates'] || {}).map((name) => (
                                                                            <option label={name} value={name} key={name}/>
                                                                        )
                                                                    )}
                                                                </select>
                                                            </div>
                                                        }
                                                        <div
                                                            className="relative overflow-x-auto shadow-md sm:rounded-lg">
                                                            <div className="w-3/12 p-2">
                                                                {dataElements.length > 0 && (configuredStages[selectedStage]['groupDataElements'] || []).map((cde, idx) => {
                                                                    const de = dataElements.find(de => de.id === cde);
                                                                    return <>
                                                                        <DataElementComponent key={idx}
                                                                                              value={groupDataElementValue(cde)}
                                                                                              dataElement={de}
                                                                                              labelVisible={true}
                                                                                              valueChanged={createOrUpdateGroupEvent}/>
                                                                    </>
                                                                })}
                                                            </div>
                                                        </div>
                                                        {configuredStages[selectedStage] && (configuredStages[selectedStage]['groupDataElements'] || []).length > 0 &&
                                                            <div className="flex flex-row justify-end">
                                                                <button type="button"
                                                                        className="mt-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                                                                        onClick={() => setModalShow(true)}>Save Event
                                                                </button>
                                                            </div>
                                                        }
                                                    </div>
                                                </div>
                                            }
                                            {selectedStage &&
                                                <div className="w-full flex flex-col pt-2">
                                                    <div className="p-8 mt-6 lg:mt-0 rounded shadow bg-white">
                                                        <div
                                                            className="relative overflow-x-auto shadow-md sm:rounded-lg">
                                                            <table
                                                                className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                                                                <caption
                                                                    className="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800">

                                                                    <p className="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">

                                                                    </p>
                                                                    <div className="flex flex-row justify-end">
                                                                        <button type="button"
                                                                                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                                                                                onClick={() => setConfirmShow(true)}>Reload
                                                                            records
                                                                        </button>
                                                                        {edits.length !== 0 && selectedEntities.length > 0 &&
                                                                            <button type="button"
                                                                                    className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                                                                                    onClick={saveEdits}>Save Records
                                                                            </button>
                                                                        }
                                                                    </div>
                                                                </caption>
                                                                <thead
                                                                    className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                                                <tr>
                                                                    {groupEdit &&
                                                                        <th rowSpan={2}
                                                                            className="px-6 py-6">
                                                                            <div
                                                                                className="flex items-center mb-4">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    onChange={(event) => {
                                                                                        if (event.target.checked) {
                                                                                            console.log('All entities', allEntities)
                                                                                            setSelectedEntities(allEntities)
                                                                                        } else {
                                                                                            setSelectedEntities([])
                                                                                            setEdits([])
                                                                                        }
                                                                                    }}
                                                                                    checked={selectedEntities.length === entities.length}
                                                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                                                                            </div>
                                                                        </th>
                                                                    }
                                                                    <th data-priority="1" className="px-6 py-3"
                                                                        rowSpan={2}>#
                                                                    </th>
                                                                    <th data-priority="2" className="px-6 py-3"
                                                                        rowSpan={2}>Profile
                                                                    </th>
                                                                    {groupEdit &&
                                                                        <th data-priority="3"
                                                                            className="px-6 py-3 mx-auto text-center"
                                                                            colSpan={columnDisplay ? datesBetween(startDate, endDate) : 1}>
                                                                        </th>
                                                                    }
                                                                </tr>
                                                                {/*{endDateVisible && !columnDisplay && !groupEdit &&
                                                        <tr>
                                                            {dates.map((date, idx) => {
                                                                return <th key={idx}
                                                                           className="px-6 py-3">
                                                                    <div className="flex flex-row gap-1">
                                                                        <div
                                                                        className="flex items-center mb-4">
                                                                        <input
                                                                            type="checkbox"
                                                                            value=""
                                                                            onChange={(event) => {
                                                                                selectDate(date, event.target.checked)
                                                                            }}
                                                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                                                                    </div>
                                                                        {formatDate(date)}
                                                                    </div>
                                                                </th>
                                                            })}
                                                        </tr>
                                                    }*/}
                                                                {/*{endDateVisible && columnDisplay && !groupEdit &&
                                                        <>
                                                            <tr>
                                                                {dates.map((date, idx) => {
                                                                    return <th key={idx}
                                                                               colSpan={(configuredStages[selectedStage]['dataElements'] || []).length}
                                                                               className="px-6 py-3">
                                                                        <div className="flex flex-row gap-1">
                                                                            <div
                                                                        className="flex items-center mb-4">
                                                                        <input
                                                                            type="checkbox"
                                                                            value=""
                                                                            onChange={(event) => {
                                                                                selectDate(date, event.target.checked)
                                                                            }}
                                                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                                                                    </div>
                                                                            {formatDate(date)}
                                                                        </div>
                                                                    </th>
                                                                })}
                                                            </tr>
                                                            <tr>
                                                                {dates.map(_ => {
                                                                    return <>
                                                                        {
                                                                            (configuredStages[selectedStage]['dataElements'] || []).map((id, idx) => {
                                                                                const de = dataElements.find(e => e.id === id)
                                                                                return <th key={idx}
                                                                                           rowSpan={5}
                                                                                           className="px-6 py-3">
                                                                                    <div
                                                                                        className="text-left -rotate-90 w-16 pb-4">{de?.name}</div>
                                                                                </th>
                                                                            })
                                                                        }
                                                                    </>
                                                                })}
                                                            </tr>
                                                        </>
                                                    }*/}
                                                                {!groupEdit && configuredStages[selectedStage] &&
                                                                    <tr>
                                                                        {(configuredStages[selectedStage]['dataElements'] || []).map((id, idx) => {
                                                                            const de = dataElements.find(e => e.id === id);
                                                                            return <th key={idx}
                                                                                       rowSpan={5}
                                                                                       className="px-6 py-3">
                                                                            <span
                                                                                className="whitespace-nowrap text-xs block font-normal text-gray-900 dark:text-gray-300 text-left -rotate-90 w-16 pb-4">{de?.name}</span>
                                                                            </th>
                                                                        })}
                                                                    </tr>
                                                                }
                                                                {groupEdit &&
                                                                    <>
                                                                        <tr>
                                                                            {individualDataElementsForDates().map((id, idx) => {
                                                                                const de = dataElements.find(e => e.id === id)
                                                                                return <th key={idx}
                                                                                           rowSpan={7}
                                                                                           className="px-6 py-3">
                                                                                    <div
                                                                                        className="text-left -rotate-90 w-16 pb-4">{de?.name}</div>
                                                                                </th>
                                                                            })}
                                                                        </tr>
                                                                        {/* <tr>
                                                                {dates.map(_ => {
                                                                    return <>
                                                                        {
                                                                            (configuredStages[selectedStage]['dataElements'] || []).map((id, idx) => {
                                                                                const de = dataElements.find(e => e.id === id)
                                                                                return <th key={idx}
                                                                                           rowSpan={5}
                                                                                           className="px-6 py-3">
                                                                                    <div
                                                                                        className="text-left -rotate-90 w-16 pb-4">{de?.name}</div>
                                                                                </th>
                                                                            })
                                                                        }
                                                                    </>
                                                                })}
                                                            </tr>*/}
                                                                    </>
                                                                }
                                                                </thead>
                                                                <tbody>
                                                                {entities.map((entity, index) => {
                                                                    return <>
                                                                        <tr className="pr-3 text-right odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                                                                            {groupEdit &&
                                                                                <td className="px-6 py-6">
                                                                                    <div
                                                                                        className="flex items-center mb-4">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={selectedEntities.map(e => e.trackedEntity).includes(entity.trackedEntity)}
                                                                                            onChange={() => {
                                                                                                if (selectedEntities.map(e => e.trackedEntity).includes(entity.trackedEntity)) {
                                                                                                    setSelectedEntities(selectedEntities.filter(rowId => rowId.trackedEntity !== entity.trackedEntity));
                                                                                                    setEdits(edits.filter(edit => edit.entity.trackedEntity !== entity.trackedEntity))
                                                                                                } else {
                                                                                                    setSelectedEntities([...selectedEntities, entity]);

                                                                                                    let currentEdit = edits.find(edit => edit.entity.trackedEntity === entity.trackedEntity);
                                                                                                    if (!currentEdit) {
                                                                                                        currentEdit = {
                                                                                                            entity
                                                                                                        };
                                                                                                    }
                                                                                                    const sample = edits[0];
                                                                                                    if (sample) {
                                                                                                        currentEdit.values = sample.values;

                                                                                                        setEdits([...edits, currentEdit]);
                                                                                                    }
                                                                                                }
                                                                                            }}
                                                                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                                                                                    </div>
                                                                                </td>
                                                                            }
                                                                            <td>{index + 1}</td>
                                                                            <td className="text-left px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{getParticipant(entity)}</td>
                                                                            {!groupEdit && dates.map((date, idx) => {
                                                                                if (!columnDisplay) {
                                                                                    return <>
                                                                                        <td key={idx}
                                                                                            className="px-6 py-4">
                                                                                            <div
                                                                                                className="flex flex-row">
                                                                                                {/* <div
                                                                                    className="w-1/12 flex flex-col">
                                                                                    <div
                                                                                        className="flex items-center mb-4">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={dateChecked(entity, date) === true}
                                                                                            onChange={(event) => {
                                                                                                checkEntity(entity, date, event.target.checked)
                                                                                            }}
                                                                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                                                                                    </div>
                                                                                </div>*/}
                                                                                                <div
                                                                                                    className="w-11/12 flex flex-col">
                                                                                                    <div
                                                                                                        className="flex flex-col gap-1">
                                                                                                        {(dataElements.length > 0 && configuredStages[selectedStage]['dataElements'] || []).map((cde, idx) => {
                                                                                                            const de = dataElements.find(de => de.id === cde);
                                                                                                            return <>
                                                                                                                <DataElementComponent
                                                                                                                    key={idx}
                                                                                                                    value={dataElementValue(date, de.id, entity)}
                                                                                                                    dataElement={de}
                                                                                                                    labelVisible={true}
                                                                                                                    valueChanged={(d, v) => createOrUpdateEvent(entity, date, de, v)}/>
                                                                                                            </>
                                                                                                        })}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </td>
                                                                                    </>
                                                                                } else {
                                                                                    return <>
                                                                                        {(configuredStages[selectedStage]['dataElements'] || []).map((id, idx2) => {
                                                                                            const de = dataElements.find(de => de.id === id);

                                                                                            return <>
                                                                                                <td>
                                                                                                    <DataElementComponent
                                                                                                        key={idx2}
                                                                                                        value={dataElementValue(date, de.id, entity)}
                                                                                                        dataElement={de}
                                                                                                        labelVisible={true}
                                                                                                        valueChanged={(d, v) => createOrUpdateEvent(entity, date, de, v)}/>
                                                                                                </td>
                                                                                            </>
                                                                                        })}
                                                                                    </>
                                                                                }
                                                                            })}
                                                                            {groupEdit && (['']).map((_, idx) => {
                                                                                if (!columnDisplay) {
                                                                                    return <>
                                                                                        <td key={idx}
                                                                                            className="px-6 py-4">
                                                                                            <div
                                                                                                className="flex flex-row">
                                                                                                {/* <div
                                                                                    className="w-1/12 flex flex-col">
                                                                                    <div
                                                                                        className="flex items-center mb-4">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={dateChecked(entity, date) === true}
                                                                                            onChange={(event) => {
                                                                                                checkEntity(entity, date, event.target.checked)
                                                                                            }}
                                                                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                                                                                    </div>
                                                                                </div>*/}
                                                                                                <div
                                                                                                    className="w-11/12 flex flex-col">
                                                                                                    <div
                                                                                                        className="flex flex-col gap-1">
                                                                                                        {dataElements.length > 0 && individualDataElementsForDates().map((cde, idx) => {
                                                                                                            const de = dataElements.find(de => de.id === cde);
                                                                                                            return <>
                                                                                                                <DataElementComponent
                                                                                                                    key={idx}
                                                                                                                    value={dataElementValue(startDate, de.id, entity)}
                                                                                                                    dataElement={de}
                                                                                                                    labelVisible={true}
                                                                                                                    valueChanged={(d, v) => createOrUpdateIndividualEvent(entity, de, v)}/>
                                                                                                            </>
                                                                                                        })}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </td>
                                                                                    </>
                                                                                } else {
                                                                                    return <>
                                                                                        {dataElements.length > 0 && individualDataElementsForDates().map((cde, idx2) => {
                                                                                            const de = dataElements.find(de => de.id === cde);
                                                                                            return <>
                                                                                                <td>
                                                                                                    <div
                                                                                                        className="flex flex-col my-auto">
                                                                                                        <DataElementComponent
                                                                                                            key={idx2}
                                                                                                            value={dataElementValue(startDate, de.id, entity)}
                                                                                                            dataElement={de}
                                                                                                            labelVisible={false}
                                                                                                            valueChanged={(d, v) => {
                                                                                                                createOrUpdateIndividualEvent(entity, de, v)
                                                                                                            }}/>
                                                                                                    </div>
                                                                                                </td>
                                                                                            </>
                                                                                        })}
                                                                                    </>
                                                                                }
                                                                            })}
                                                                        </tr>
                                                                    </>
                                                                })}
                                                                </tbody>
                                                                <tfoot>
                                                                <tr className="font-semibold text-gray-900 dark:text-white">
                                                                    <th scope="row" className="px-6 py-3 text-base">

                                                                    </th>
                                                                </tr>
                                                                </tfoot>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                            }
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Modal hide={!modalShow}>
                <ModalTitle>Event</ModalTitle>

                <ModalContent>
                    <div
                        className="w-full mb-2">
                        <label
                            className="text-left block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            Event Name
                        </label>
                        <input
                            type="text"
                            value={templateName}
                            onChange={(event) => setTemplateName(event.target.value)}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"/>
                    </div>
                </ModalContent>

                <ModalActions>
                    <button type="button"
                            className="py-2.5 px-5 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                            onClick={() => {
                                setModalShow(false);
                            }}>
                        Cancel
                    </button>

                    <button type="button"
                            className={classnames(
                                {'text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800': !!templateName},
                                {'text-white bg-blue-400 dark:bg-blue-500 cursor-not-allowed font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 text-center': !templateName}
                            )}
                            disabled={!templateName}
                            onClick={() => {
                                setModalShow(false);
                                saveGroupTemplate();
                            }}>
                        Save
                    </button>
                </ModalActions>
            </Modal>
            <Modal hide={!confirmShow}>
                <ModalTitle>Reload profiles</ModalTitle>

                <ModalContent>
                    Click ok to reload data. Any unsaved data will be lost
                </ModalContent>

                <ModalActions>
                    <button type="button"
                            className="py-2.5 px-5 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                            onClick={() => {
                                setConfirmShow(false);
                            }}>
                        Cancel
                    </button>

                    <button type="button"
                            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                            onClick={() => {
                                refetch({
                                    program: selectedProgram,
                                    orgUnit: orgUnit,
                                    page: 1,
                                    pageSize
                                });
                                setConfirmShow(false);
                            }}>
                        Reload
                    </button>
                </ModalActions>
            </Modal>
        </>
    )
}
