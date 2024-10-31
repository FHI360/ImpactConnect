import PropTypes from 'prop-types';
import React from 'react';
import ArrowDown from '../icons/arrow-down.svg';
import ArrowUp from '../icons/arrow-up.svg';

export const DataElementSortComponent=({checkDataElements, dataElements, moveDataElement, onClose})=> {
    return (
        <>
            <div className="p-8 mt-6 lg:mt-0 card">
                <div
                    className="relative overflow-x-auto shadow-md sm:rounded-lg">
                    <table
                        className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                        <thead
                            className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th data-priority="1" className="px-6 py-3 w-1/12">#</th>
                            <th data-priority="2" className="px-6 py-3 w-9/12 text-left">
                                Data Element
                            </th>
                            <th className="w-2/12"></th>
                        </tr>
                        </thead>
                        <tbody>
                        {(checkDataElements || []).map((dataElement, index) => {
                            return <>
                                <tr>
                                    <td>{index + 1}</td>
                                    <td className="text-left px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{dataElements.find(de => de.id === dataElement)?.name}</td>
                                    <td>
                                        <div className="flex flex-row">
                                            {index < ((checkDataElements || []).length - 1) &&
                                                <div
                                                    onClick={() => moveDataElement(index, index + 1)}>
                                                    <img width={24} src={ArrowDown}/>
                                                </div>
                                            }
                                            {index === ((checkDataElements || []).length - 1) &&
                                                <div className="w-6"></div>
                                            }
                                            {index > 0 &&
                                                <div
                                                    onClick={() => moveDataElement(index, index - 1)}>
                                                    <img width={24} src={ArrowUp}/>
                                                </div>
                                            }
                                        </div>
                                    </td>
                                </tr>
                            </>
                        })}
                        </tbody>
                        <tfoot>
                        <tr className="font-semibold text-gray-900 dark:text-white">
                            <th colSpan={2} className="px-6 py-3 text-base">
                                <button type="button"
                                        className="primary-btn"
                                        onClick={onClose}>Close
                                </button>
                            </th>
                        </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </>
    )
}

DataElementSortComponent.propTypes = {
    checkDataElements: PropTypes.array.isRequired,
    dataElements: PropTypes.array.isRequired,
    moveDataElement: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
}
