import { useDataEngine } from '@dhis2/app-runtime';
import { CalendarInput } from '@dhis2/ui';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

export const DataElementComponent = ({dataElement, labelVisible = true, label, value, valueChanged, readonly}) => {
    const engine = useDataEngine();
    const [attributeOptions, setAttributeOptions] = useState({})
    return (
        <>
            <div>
                {dataElement && [dataElement].map(de => {
                    if (de.optionSet?.id) {
                        const optionsQuery = {
                            optionSets: {
                                resource: 'optionSets',
                                id: de.optionSet.id,
                                params: {
                                    fields: 'id,options(code,displayName)',
                                }
                            }
                        }
                        engine.query(optionsQuery).then(d => {
                            const ao = attributeOptions;
                            ao[de.id] = d.optionSets?.options || [];
                            setAttributeOptions(ao);
                        });
                        return <>
                            <div className="">
                                {labelVisible &&
                                    <label className="label">
                                        {label || de.name || de.displayName}
                                    </label>
                                }
                                <select className="select"
                                        value={value}
                                        disabled={readonly}
                                        onChange={(event) => valueChanged(de, event.target.value)}>
                                    <option
                                        selected>Select one
                                    </option>
                                    {(attributeOptions[de.id] || []).filter(option => !!option).map(option => {
                                            return <>
                                                <option
                                                    value={option.code}>{option.displayName}</option>
                                            </>
                                        }
                                    )}
                                </select>
                            </div>
                        </>
                    } else {
                        if ((de.valueType === 'TRUE_ONLY' || de.valueType === 'BOOLEAN')) {
                            return <>
                                <div
                                    className="flex items-center mb-4">
                                    <input
                                        type="checkbox"
                                        disabled={readonly}
                                        checked={value === true || value === 'true'}
                                        onChange={(event) => valueChanged(de, event.target.checked)}
                                        className="checkbox"/>
                                    {labelVisible &&
                                        <label className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                            {label || de.name || de.displayName}
                                        </label>
                                    }
                                </div>
                            </>
                        }
                        if ((de.valueType.includes('INTEGER') || de.valueType === 'NUMBER')) {
                            return <>
                                <div
                                    className="mb-5">
                                    {labelVisible &&
                                        <label className="text-left label">
                                            {label || de.name || de.displayName}
                                        </label>
                                    }
                                    <input
                                        type="number"
                                        value={value}
                                        disabled={readonly}
                                        onChange={(event) => valueChanged(de, event.target.value)}
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"/>
                                </div>
                            </>
                        }
                        if (de.valueType.includes('TEXT')) {
                            return <>
                                <div
                                    className="mb-5">
                                    {labelVisible &&
                                        <label className="text-left label">
                                            {label || de.name || de.displayName}
                                        </label>
                                    }
                                    <input
                                        type="text"
                                        value={value}
                                        disabled={readonly}
                                        onChange={(event) => {
                                            console.log('Change', event.target.value, event)
                                            valueChanged(de, event.target.value)
                                        }}
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"/>
                                </div>
                            </>
                        }
                        if (de.valueType.includes('DATE')) {
                            return <>
                                <div
                                    className="mb-5 flex flex-col">
                                    {labelVisible &&
                                        <label className="text-left label">
                                            {label || de.name || de.displayName}
                                        </label>
                                    }
                                    <CalendarInput
                                        calendar="gregory"
                                        label=""
                                        disabled={readonly}
                                        date={(value ?? '').substring(0, 10)}
                                        onDateSelect={(event) => valueChanged(de, new Date(event.calendarDateString).toISOString())}
                                    />
                                </div>
                            </>
                        }
                    }
                })}
            </div>
        </>
    )
}

DataElementComponent.propTypes = {
    dataElement: PropTypes.string,
    label: PropTypes.string,
    labelVisible: PropTypes.bool,
    readonly: PropTypes.bool,
    value: PropTypes.string,
    valueChanged: PropTypes.func
};
