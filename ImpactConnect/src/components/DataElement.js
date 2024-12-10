import { useAlert, useDataEngine } from '@dhis2/app-runtime';
import i18n from '@dhis2/d2-i18n';
import { CalendarInput } from '@dhis2/ui';
import PropTypes from 'prop-types';
import React, { useEffect, useMemo, useState } from 'react';
import { EVENT_OPTIONS } from '../consts.js';
import { applyConditionAction } from '../utils.js';
import { SpinnerComponent } from './SpinnerComponent.js';

export const DataElementComponent = ({
                                         dataElement,
                                         labelVisible = true,
                                         label,
                                         value,
                                         required,
                                         valueChanged,
                                         readonly,
                                         values,
                                         stage,
                                         conditions,
                                         optionAdd = false,
                                         setEditingOption = (_) => {
                                         },
                                         setInvalid = (valid) => {},
                                         optionRenamed = (oldName, newName) => {}
                                     }) => {
    const engine = useDataEngine();

    const [id, setId] = useState('');
    const [name, setName] = useState('');
    const [options, setOptions] = useState([]);
    const [valueType, setValueType] = useState('');
    const [edit, setEdit] = useState(false);
    const [renameMode, setRenameMode] = useState(false);
    const [optionLabel, setOptionLabel] = useState('');
    const [optionValue, setOptionValue] = useState();
    const [error, setError] = useState('');
    const [optionSetId, setOptionSetId] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedValue, setSelectedValue] = useState('');
    const [visible, setVisible] = useState(true);
    const [enabled, setEnabled] = useState(true);
    const [warning, setWarning] = useState(false);
    const [elementValue, setElementValue] = useState(null);
    const [toggle, setToggle] = useState(false);

    const memorizedOptionSetId = useMemo(() => optionSetId, [optionSetId]);

    const {show} = useAlert(
        ({msg}) => msg,
        ({type}) => ({[type]: true})
    )

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

            setLoading(true);
            engine.query(optionsQuery).then(d => {
                setOptions(d.optionSet?.options.filter(o => !!o) || []);
                setValueType(d.optionSet?.valueType);
                setId(d.optionSet?.id);
                setName(d.optionSet?.name);

                setLoading(false);
            });
        }
    }, [memorizedOptionSetId, toggle]);

    useEffect(() => {
        const condition = applyConditionAction(conditions, stage, dataElement, values, elementValue);
        if (condition.action === 'disable') {
            setEnabled(false);
        } else {
            setEnabled(true);
        }
        if (condition.action === 'hide') {
            setVisible(false);
        } else {
            setVisible(true);
        }
        if (condition.action === 'show_warning') {
            setWarning(true);
        } else {
            setWarning(false);
        }
        if (condition.action === 'mark_invalid') {
            setInvalid(true);
        } else {
            setInvalid(false)
        }
    }, [values, conditions, stage, dataElement, elementValue]);

    useEffect(() => {
        if (warning) {
            if (warning) {
                show({msg: i18n.t('Value cannot be updated as conditions not met'), type: 'error'});
                valueChanged(dataElement, '');
            }
        }
    }, [warning]);

    if (dataElement?.id === EVENT_OPTIONS.attributes.event) {
        optionAdd = true;
    }

    const updateValue = (value) => {
        setElementValue(value);
        valueChanged(dataElement, value);
    }

    const renameOption = () => {
        const option = options.find(opt => opt.code === selectedValue);
        const oldName = option.displayName;
        if (option) {
            setLoading(true);
            option.displayName = optionLabel.replace(/\s+/g, ' ').trim();
            engine.mutate({
                resource: 'options',
                type: 'update',
                id: option.id,
                data: {
                    name: option.displayName,
                    code: option.code,
                    optionSet: {
                        id: optionSetId
                    }
                }
            }).then(_ => {
                show({msg: i18n.t('Option successfully updated'), type: 'success'});

                setOptions(prev => {
                    const updatedOptions = prev.filter(opt => opt.code !== option.code);
                    updatedOptions.push(option);
                    return updatedOptions;
                });

                optionRenamed(oldName, option.displayName);
                setEdit(false);
                setLoading(false);
            });
        }
    }

    const addOption = () => {
        setLoading(true);

        const label = optionLabel.replace(/\s+/g, ' ').trim();
        const option = {
            displayName: label,
            code: valueType.includes('TEXT') ? optionLabel : null
        };
        const existing = options.find(option => option.displayName.replace(/\s+/g, ' ').trim().toLowerCase() === label.toLowerCase());
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
                                setSelectedValue(option.code);
                                setToggle((prev) => !prev)

                                show({msg: i18n.t('Option successfully added'), type: 'success'});
                                setLoading(false);
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

    const toBoolean = (value) => {
        if (typeof value === 'string') {
            return value.toLowerCase() === 'true';
        }
        return !!value;
    }

    return (
        <>
            <div>
                {dataElement?.optionSet?.id && visible &&
                    <div className="flex flex-col">
                        {labelVisible &&
                            <label className="label">
                                {label || dataElement.name || dataElement.displayName} {dataElement?.id === EVENT_OPTIONS.attributes.event && <span className="required">*</span>}
                            </label>
                        }
                        <div className="flex flex-row">
                            <select className="select"
                                    value={value ?? optionValue ?? ''}
                                    disabled={(readonly && !edit) || !enabled}
                                    onChange={(event) => {
                                        setEdit(false);
                                        valueChanged(dataElement, event.target.value);
                                        setSelectedValue(event.target.value);
                                    }}>
                                {loading ? (
                                    <option>Loading...</option>
                                ) : (
                                    <>
                                        <option defaultValue={null}>Select one</option>
                                        {options.filter(o => !!o).sort((n1, n2) => n1.displayName.localeCompare(n2.displayName)).filter(option => !!option).map(option => (
                                            <option key={option.code} value={option.code}>
                                                {option.displayName}
                                            </option>
                                        ))}
                                    </>
                                )}
                            </select>
                            {!edit && !readonly && optionAdd && enabled &&
                                <>
                                    <div className="p-1" onClick={() => {
                                        setEdit(true);
                                        setSelectedValue('');
                                        setRenameMode(false);
                                        setEditingOption(true)
                                    }}>
                                        <button type="button"
                                                className="primary-btn">
                                            Add
                                        </button>
                                    </div>
                                    {value && value !== 'Select one' &&
                                        <div className="p-2" onClick={() => {
                                            setEdit(true);
                                            setEditingOption(true)
                                            setRenameMode(true);
                                            const option = options.find(opt => opt.code === selectedValue);
                                            setOptionLabel(option?.displayName)
                                        }}>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                aria-hidden="true"
                                                width="24"
                                                height="24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                                                />
                                            </svg>
                                        </div>
                                    }
                                </>
                            }
                        </div>
                        {edit &&
                            <div className="flex flex-row pt-2 gap-2">
                                <div className="w-9/12">
                                    <input
                                        type="text"
                                        value={optionLabel}
                                        onChange={(event) => {
                                            setOptionLabel(event.target.value)
                                        }}
                                        className="text-input"/>
                                </div>
                                {optionLabel &&
                                    <button type="button" onClick={() => {
                                        renameMode ? renameOption() : addOption();
                                        setEditingOption(false);
                                    }}
                                            disabled={loading}
                                            className={loading ? 'primary-btn-disabled' : 'primary-btn'}>
                                        <div
                                            className="flex flex-row">
                                            {loading &&
                                                <div
                                                    className="pr-2">
                                                    <SpinnerComponent/>
                                                </div>
                                            }
                                            <span>{renameMode ? 'Rename' : 'Add'}</span>
                                        </div>
                                    </button>
                                }
                                <button type="button" onClick={() => {
                                    setEdit(false);
                                    setEditingOption(false)
                                }}
                                        className="default-btn">
                                    Cancel
                                </button>
                            </div>
                        }
                    </div>
                }
                {dataElement && !dataElement?.optionSet?.id && visible &&
                    <>
                        {((dataElement.valueType === 'TRUE_ONLY' || dataElement.valueType === 'BOOLEAN')) &&
                            <div className="flex items-center mb-4">
                                <input
                                    type="checkbox"
                                    disabled={readonly || !enabled}
                                    checked={toBoolean(value)}
                                    onChange={(event) => valueChanged(dataElement, event.target.checked)}
                                    className="checkbox"/>
                                {labelVisible &&
                                    <label className="label pl-2 pt-2">
                                        {label || dataElement.name || dataElement.displayName}{required && '*'}
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
                                    disabled={readonly || !enabled}
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
                                        {label || dataElement.name || dataElement.displayName}{required && '*'}
                                    </label>
                                }
                                <input
                                    type="text"
                                    value={value ?? ''}
                                    disabled={readonly || !enabled}
                                    onChange={(event) => valueChanged(dataElement, event.target.value)}
                                    className="text-input"/>
                            </div>
                        }
                        {(dataElement.valueType.includes('DATE')) &&
                            <div className="mb-2 flex flex-col">
                                {labelVisible &&
                                    <label className="text-left label">
                                        {label || dataElement.name || dataElement.displayName}{required && '*'}
                                    </label>
                                }
                                <CalendarInput
                                    calendar="gregory"
                                    label=""
                                    disabled={readonly || !enabled}
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
    conditions: PropTypes.array,
    dataElement: PropTypes.object,
    label: PropTypes.string,
    labelVisible: PropTypes.bool,
    optionAdd: PropTypes.bool,
    optionRenamed: PropTypes.func,
    readonly: PropTypes.bool,
    required: PropTypes.bool,
    setEditingOption: PropTypes.func,
    setInvalid: PropTypes.func,
    stage: PropTypes.string,
    value: PropTypes.string,
    valueChanged: PropTypes.func,
    values: PropTypes.object
};
