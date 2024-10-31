import PropTypes from 'prop-types';
import React from 'react';

export const ConfiguredDataElements =({caption, checkDataElements, dataElements, configuredStages, selectedStage, onDelete, onSave, onSelect, onSelectAll})=> {
    return (
        <>
            <div className="p-8 mt-6 lg:mt-0 rounded shadow bg-white">
                <div
                    className="relative overflow-x-auto shadow-md sm:rounded-lg">
                    <table
                        className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                        <caption
                            className="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800">
                            Data Elements
                            <p className="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">
                                {caption}
                            </p>
                        </caption>
                        <thead
                            className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
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
                                    <td className="text-left px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{dataElement.name}</td>
                                </tr>
                            </>
                        })}
                        </tbody>
                        <tfoot>
                        <tr className="font-semibold text-gray-900 dark:text-white">
                            <th colSpan={3} className="px-6 py-3 text-base">
                                {checkDataElements?.length > 0 &&
                                    <button type="button"
                                            className="primary-btn py-1"
                                            onClick={onSave}>Save stage
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
            </div>
        </>
    )
}

ConfiguredDataElements.propTypes = {
    caption: PropTypes.string,
    checkDataElements: PropTypes.array,
    configuredStages: PropTypes.object,
    dataElements: PropTypes.array,
    selectedStage: PropTypes.string,
    onDelete: PropTypes.func,
    onSave: PropTypes.func,
    onSelect: PropTypes.func,
    onSelectAll: PropTypes.func
}
