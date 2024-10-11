import { useDataEngine } from '@dhis2/app-runtime';
import { CalendarInput } from '@dhis2/ui';
import React, { useState } from 'react';

export const DataElementComponent = ({dataElement, labelVisible, label, value, valueChanged}) => {
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
                            <div className="p-2">
                                {labelVisible &&
                                    <label htmlFor="program"
                                           className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                        {label || de.name}
                                    </label>
                                }
                                <select id="program"
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                        value={value}
                                        onChange={(event) => valueChanged(de, event.target.value)}>
                                    <option
                                        selected>Select one
                                    </option>
                                    {(attributeOptions[de.id] || []).map(option => {
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
                                        checked={value === true || value === 'true'}
                                        onChange={(event) => valueChanged(de, event.target.checked)}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                                    {labelVisible &&
                                        <label className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                            {label || de.name}
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
                                        <label className="ext-left block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                            {label || de.name}
                                        </label>
                                    }
                                    <input
                                        type="number"
                                        value={value}
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
                                        <label className="ext-left block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                            {label || de.name}
                                        </label>
                                    }
                                    <input
                                        type="text"
                                        value={value}
                                        onChange={(event) => valueChanged(de, event.target.value)}
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"/>
                                </div>
                            </>
                        }
                        if (de.valueType.includes('DATE')) {
                            return <>
                                <div
                                    className="mb-5 flex flex-col">
                                    {labelVisible &&
                                        <label className="ext-left block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                            {label || de.name}
                                        </label>
                                    }
                                    <CalendarInput
                                        calendar="gregory"
                                        label=""
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
