import { useDataQuery } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n';
import React from 'react'

/*  Query Parameters**/
const query = {
    programsMetadata: {
        resource: 'programs',
        params: {
            // pageSize: 5,
            fields: ['id', 'displayName'],
        },
    }
}

const ProgramComponent = ({selectedProgram, setSelectedProgram, disabled}) => {

    const { error: error, data: data} = useDataQuery(query);

    if (error) {
        return <span>ERROR: {error.message}</span>
    }

    const handleProgramChange = event => {
        event.preventDefault();
        setSelectedProgram(event.target.value);
    };

    return (
        <div>
            <label htmlFor="program" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                {i18n.t('Select program')}
            </label>
            <select id="program"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    value={selectedProgram}
                    disabled={disabled}
                    onChange={handleProgramChange}>
                <option selected>Choose a program</option>
                {data?.programsMetadata?.programs.map(({id, displayName}) => (
                        <option label={displayName} value={id} key={id}/>
                    )
                )}
            </select>
        </div>
    )
}
export default ProgramComponent
