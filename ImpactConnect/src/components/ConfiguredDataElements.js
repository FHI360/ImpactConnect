import { IconView24 } from '@dhis2/ui-icons';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import ConfigureCondition from './ConfiguredConditionComponent.js';
import TooltipComponent from './TooltipComponent.js';

export const ConfiguredDataElements = ({
                                           setSelectedConfiguredCondition,
                                           configuredCondition,
                                           stages,
                                           caption,
                                           checkDataElements,
                                           dataElements,
                                           configuredStages,
                                           selectedStage,
                                           onDelete,
                                           onSave,
                                           onSelect,
                                           onSelectAll,
                                           onCancel
                                       }) => {
    const [showConditionsModal, setShowConditionsModal] = useState(false);
    const [selectedCondition, setSelectedConditions] = useState('');
    const [deleteAction, setDeleteAction] = useState(false)

    const handleConfigureCondition = (connditionID) => {
        setSelectedConditions(connditionID)
        setShowConditionsModal(true)
    }

    return (
        <>
            <div className="p-8 mt-6 lg:mt-0 rounded shadow bg-white">
                <div
                    className="relative overflow-x-auto shadow-md sm:rounded-lg">
                    <table
                        className="w-full text-sm text-left rtl:text-right text-gray-500">
                        <caption
                            className="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white">
                            {stages.find(stage => stage.id === selectedStage)?.displayName}
                            <p className="mt-1 text-sm font-normal text-gray-500 0">
                                {caption}
                            </p>
                        </caption>
                        <thead
                            className="text-xs text-gray-700 uppercase bg-gray-50 ">
                        <tr>
                            <th className="px-6 py-6 w-1/12">
                                <div
                                    className="flex items-center mb-4">
                                    <input
                                        type="checkbox"
                                        onChange={(event) => {
                                            onSelectAll(event.target.checked);
                                        }}
                                        checked={checkDataElements?.length === dataElements.length}
                                        className="checkbox"/>
                                </div>
                            </th>
                            <th data-priority="1" className="px-6 py-3 w-1/12">#
                            </th>
                            <th data-priority="2" className="px-6 py-3 w-10/12 text-left">
                                Data Element
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {dataElements.map((dataElement, index) => {
                            return <>
                                <tr>
                                    <td className="px-6 py-6">
                                        <div
                                            className="flex items-center mb-4">
                                            <input
                                                type="checkbox"
                                                checked={checkDataElements?.includes(dataElement.id)}
                                                onChange={() => {
                                                    onSelect(dataElement.id);
                                                }}
                                                className="checkbox"/>
                                        </div>
                                    </td>
                                    <td>{index + 1}</td>
                                    <td className="text-left px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{dataElement.name}
                                        <TooltipComponent
                                            IconType={IconView24}
                                            btnFunc={handleConfigureCondition}
                                            conditionID={dataElement.id}
                                            // conditionID={selectedCondition}
                                            dynamicText="Rule"
                                            buttonMode="secondary"
                                            customIcon={true}
                                            disabled={false}
                                        />
                                    </td>
                                </tr>
                            </>
                        })}
                        </tbody>
                        <tfoot>
                        <tr className="font-semibold text-gray-900 ">
                            <th colSpan={3} className="px-6 py-3 text-base">
                                <button type="button"
                                        className="default-btn py-1"
                                        onClick={onCancel}>Cancel
                                </button>
                                {checkDataElements?.length > 0 &&
                                    <button type="button"
                                            className="primary-btn py-1"
                                            onClick={onSave}>Next
                                    </button>
                                }
                                {configuredStages[selectedStage] &&
                                    <button type="button"
                                            className="warn-btn py-1"
                                            onClick={onDelete}>Delete Stage Config
                                    </button>
                                }
                            </th>
                        </tr>
                        </tfoot>
                    </table>
                </div>
                {showConditionsModal &&
                    <ConfigureCondition
                        dataElements={dataElements}
                        selectedCondition={selectedCondition}
                        configuredCondition={configuredCondition}
                        setShowConditionsModal={setShowConditionsModal}
                        setSelectedConfiguredCondition={setSelectedConfiguredCondition}
                        setDeleteAction={setDeleteAction}
                        selectedStage={selectedStage}
                    />
                }
            </div>
        </>
    )
}

ConfiguredDataElements.propTypes = {
    caption: PropTypes.string,
    checkDataElements: PropTypes.array,
    configuredCondition: PropTypes.array,
    configuredStages: PropTypes.object,
    dataElements: PropTypes.array,
    selectedStage: PropTypes.string,
    setSelectedConfiguredCondition: PropTypes.func,
    stages: PropTypes.array,
    onCancel: PropTypes.func,
    onDelete: PropTypes.func,
    onSave: PropTypes.func,
    onSelect: PropTypes.func,
    onSelectAll: PropTypes.func
}
