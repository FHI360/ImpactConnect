import PropTypes from 'prop-types';
import React, { useState } from 'react';

export const SearchComponent = ({search}) => {
    const [keyword, setKeyword] = useState('');

    return <>
        <div className="flex flex-row">
            <div className="relative w-full flex flex-row">
                <input type="text"
                       className="text-input"
                       placeholder="Search name..."
                       value={keyword}
                       onChange={(event) => setKeyword(event.target.value)}
                />
                {keyword &&
                    <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={() => {
                            setKeyword('');
                            search('');
                        }}
                    >
                        <svg
                            className="w-5 h-5 text-gray-400 hover:text-gray-600"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path fill-rule="evenodd"
                                  d="M6.293 6.293a1 1 0 011.414 0L10 8.586l2.293-2.293a1 1 0 111.414 1.414L11.414 10l2.293 2.293a1 1 0 01-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 01-1.414-1.414L8.586 10 6.293 7.707a1 1 0 010-1.414z"
                                  clip-rule="evenodd"/>
                        </svg>
                    </button>
                }
            </div>
            <button onClick={() => search(keyword)}
                    className="p-2.5 ms-2 text-sm font-medium text-white bg-blue-700 rounded-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                <svg className="w-4 h-4" aria-hidden="true"
                     xmlns="http://www.w3.org/2000/svg"
                     fill="none"
                     viewBox="0 0 20 20">
                    <path stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                </svg>
                <span className="sr-only">Search</span>
            </button>
        </div>
    </>
}

SearchComponent.propTypes = {
    search: PropTypes.func
};
