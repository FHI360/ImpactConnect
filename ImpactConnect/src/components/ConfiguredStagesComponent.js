import PropTypes from 'prop-types';
import React from 'react';

export const ConfiguredStagesComponent = ({stages, configuredStages, onEdit, onSort, single, groupEdit}) => {
    const hasDataElements = (arr) => {
        return Array.isArray(arr) && arr.length > 0;
    }
    return (
        <>
            {Object.keys(configuredStages).map((stage) => {
                if (stage && (single ? hasDataElements(configuredStages[stage]['individualDataElements']) :
                    groupEdit ? hasDataElements(configuredStages[stage]['groupDataElements']) : hasDataElements(configuredStages[stage]['dataElements']))) {
                    return <>
                        <div className="border-b p-2 bg-gray-100 w-full flex flex-row">
                            <div className="w-7/12">
                                {stages.find(s => s.id === stage)?.displayName}
                            </div>
                            <div className="w-5/12 flex-row flex">
                                <button type="button"
                                        className="primary-btn"
                                        onClick={() => onEdit(stage)}>Edit Stage
                                </button>
                                <button type="button"
                                        className="primary-btn"
                                        onClick={() => onSort(stage)}>Sort Order
                                </button>
                            </div>
                        </div>
                    </>
                }
            })
            }
        </>
    )
}

ConfiguredStagesComponent.propTypes = {
    configuredStages: PropTypes.object,
    groupEdit: PropTypes.bool,
    single: PropTypes.bool,
    stages: PropTypes.array,
    onEdit: PropTypes.func,
    onSort: PropTypes.func
}
