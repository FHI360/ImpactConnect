import { useDataEngine } from '@dhis2/app-runtime';
import { CalendarInput } from '@dhis2/ui';
import PropTypes from 'prop-types';
import React, { useEffect, useMemo, useState } from 'react';

export const DataElementComponent = ({ dataElement, labelVisible = true, label, value, valueChanged, readonly, optionAdd = true }) => {
    const engine = useDataEngine();

    const [id, setId] = useState('');
    const [name, setName] = useState('');
    const [options, setOptions] = useState([]);
    const [valueType, setValueType] = useState('');
    const [edit, setEdit] = useState(false);
    const [optionLabel, setOptionLabel] = useState('');
    const [optionValue, setOptionValue] = useState();
    const [error, setError] = useState('');
    const [optionSetId, setOptionSetId] = useState('');
    const memorizedOptionSetId = useMemo(() => optionSetId, [optionSetId]);

    useEffect(() => {
        if (dataElement?.optionSet?.id && dataElement?.optionSet.id !== optionSetId) {
            setOptionSetId(dataElement?.optionSet.id);
        }
    }, [dataElement, optionSetId]);

    useEffect(() => {
        if (optionSetId) {
            const optionsQuery = {
                optionSet: {
                    resource: 'optionSets',
                    id: optionSetId,
                    params: {
                        fields: 'id,name,valueType,options(id,code,displayName)',
                    }
                }
            };
            engine.query(optionsQuery).then(d => {
                setOptions(d.optionSet?.options.filter(o => !!o) || []);
                setValueType(d.optionSet?.valueType);
                setId(d.optionSet?.id);
                setName(d.optionSet?.name);
            });
        }
    }, [memorizedOptionSetId]);

    const addOption = () => {
        const option = {
            displayName: optionLabel,
            code: valueType.includes('TEXT') ? optionLabel : null
        };
        const existing = options.find(option => option.displayName.replace(/\s+/g, ' ').trim().toLowerCase() === optionLabel.toLowerCase());
        if (existing) {
            setOptionValue(existing.code);
            setEdit(false);
            valueChanged(dataElement, existing.code);
        } else {
            if (valueType === 'INTEGER_POSITIVE' || valueType === 'INTEGER') {
                const next = Math.max(...options.map(o => parseInt(o.code))) + 1;
                option.code = next + '';
            }
            if (valueType === 'NEGATIVE_POSITIVE') {
                const next = Math.min(...options.map(o => parseInt(o.code))) - 1;
                option.code = next + '';
            }

            if (id) {
                engine.mutate({
                    resource: 'options',
                    type: 'create',
                    data: {
                        name: option.displayName,
                        code: option.code
                    }
                }).then(res => {
                    if (res.status === 'OK') {
                        option.id = res.response.uid;
                        options.push(option);
                        const optionSet = {
                            optionSets: [
                                {
                                    id,
                                    name,
                                    valueType,
                                    options
                                }
                            ]
                        };
                        engine.mutate({
                            resource: 'metadata',
                            type: 'create',
                            data: optionSet
                        }).then(res => {
                            if (res.status === 'OK') {
                                setOptionValue(option.code);
                                setEdit(false);
                                valueChanged(dataElement, option.code);
                            }
                        });
                    }
                });
            }
        }
    }

    const validateNumericInput = (event) => {
        const inputValue = event.target.value;
        let valid = false;

        if (valueType === 'INTEGER_ZERO_OR_POSITIVE') {
            const value = parseInt(inputValue);
            valid = value >= 0;
        } else if (valueType === 'INTEGER_NEGATIVE') {
            const value = parseInt(inputValue);
            valid = value < 0;
        } else if (valueType === 'INTEGER_POSITIVE') {
            const value = parseInt(inputValue);
            valid = value > 0;
        }
        if (!valid) {
            setError('Invalid input');
            return false;
        }
        setError('');
        return true;
    };

    return (
        <>
            <div>
                {dataElement?.optionSet?.id &&
                    <div className="flex flex-col">
                        {labelVisible &&
                            <label className="label">
                                {label || dataElement.name || dataElement.displayName}
                            </label>
                        }
                        <div className="flex flex-row">
                            <select className="select"
                                    value={value ?? optionValue ?? ''}
                                    disabled={readonly}
                                    onChange={(event) => {
                                        setEdit(false);
                                        valueChanged(dataElement, event.target.value);
                                    }}>
                                <option defaultValue={''}>Select one</option>
                                {options.filter(option => !!option).map(option => (
                                    <option key={option.code} value={option.code}>
                                        {option.displayName}
                                    </option>
                                ))}
                            </select>
                            {!edit && !readonly && optionAdd &&
                                <div className="p-2" onClick={() => setEdit(true)}>+</div>
                            }
                        </div>
                        {edit &&
                            <div className="flex flex-row pt-2 gap-2">
                                <div className="w-9/12">
                                    <input
                                        type="text"
                                        onChange={(event) => {
                                            setOptionLabel(event.target.value.replace(/\s+/g, ' ').trim())
                                        }}
                                        className="text-input"/>
                                </div>
                                {optionLabel &&
                                    <button type="button" onClick={addOption} className="primary-btn">
                                        Add
                                    </button>
                                }
                                <button type="button" onClick={() => setEdit(false)} className="default-btn">
                                    Cancel
                                </button>
                            </div>
                        }
                    </div>
                }
                {!dataElement.optionSet?.id &&
                    <>
                        {((dataElement.valueType === 'TRUE_ONLY' || dataElement.valueType === 'BOOLEAN')) &&
                            <div className="flex items-center mb-4">
                                <input
                                    type="checkbox"
                                    disabled={readonly}
                                    checked={value === true || value === 'true'}
                                    onChange={(event) => valueChanged(dataElement, event.target.checked)}
                                    className="checkbox"/>
                                {labelVisible &&
                                    <label className="label pl-2 pt-2">
                                        {label || dataElement.name || dataElement.displayName}
                                    </label>
                                }
                            </div>
                        }

                        {((dataElement.valueType.includes('INTEGER') || dataElement.valueType === 'NUMBER')) &&
                            <div className="mb-5">
                                {labelVisible &&
                                    <label className="text-left label">
                                        {label || dataElement.name || dataElement.displayName}
                                    </label>
                                }
                                <input
                                    type="number"
                                    value={value ?? ''}
                                    disabled={readonly}
                                    onChange={(event) => {
                                        if (validateNumericInput(event)) {
                                            valueChanged(dataElement, event.target.value);
                                        }
                                    }}
                                    className="text-input"/>
                                {error && <span style={{color: 'red'}}>{error}</span>}
                            </div>
                        }
                        {(dataElement.valueType.includes('TEXT')) &&
                            <div className="mb-5">
                                {labelVisible &&
                                    <label className="text-left label">
                                        {label || dataElement.name || dataElement.displayName}
                                    </label>
                                }
                                <input
                                    type="text"
                                    value={value ?? ''}
                                    disabled={readonly}
                                    onChange={(event) => valueChanged(dataElement, event.target.value)}
                                    className="text-input"/>
                            </div>
                        }
                        {(dataElement.valueType.includes('DATE')) &&
                            <div className="mb-2 flex flex-col">
                                {labelVisible &&
                                    <label className="text-left label">
                                        {label || dataElement.name || dataElement.displayName}
                                    </label>
                                }
                                <CalendarInput
                                    calendar="gregory"
                                    label=""
                                    disabled={readonly}
                                    date={(value ?? '').substring(0, 10)}
                                    onDateSelect={(event) => valueChanged(dataElement, new Date(event.calendarDateString).toISOString())}
                                />
                            </div>
                        }
                    </>
                }
            </div>
        </>
    );
}

DataElementComponent.propTypes = {
    dataElement: PropTypes.object,
    label: PropTypes.string,
    labelVisible: PropTypes.bool,
    optionAdd: PropTypes.bool,
    readonly: PropTypes.bool,
    value: PropTypes.string,
    valueChanged: PropTypes.func
};
