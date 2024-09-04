import { useDataQuery } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n';
import React, { useEffect } from 'react'

const query = {
    programStages: {
        resource: 'programStages',
        params: ({program}) => ({
            fields: ['id', 'displayName', 'programStageDataElements(dataElement(id, name, valueType))'],
            filter: `program.id:eq:${program || '-'}`,
        })
    }
}

const ProgramStageComponent = ({selectedProgram, selectedStage, setSelectedStage}) => {
    const program = selectedProgram || '-';
    const {error: error, data: data, refetch} = useDataQuery(query, {variables: {program}});

    useEffect(() => {
        refetch({program: selectedProgram});
    }, [program]);

    if (error) {
        return <span>ERROR: {error.message}</span>
    }

    const handleStageChange = event => {
        event.preventDefault();
        setSelectedStage(event.target.value);
    };

    return (
        <div>
            <label htmlFor="stage" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                {i18n.t('Select program stage')}
            </label>
            <select id="stage"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    value={selectedStage}
                    onChange={handleStageChange}>
                <option selected>Choose a program stage</option>
                {data?.programStages?.programStages?.map(({id, displayName}) => (
                        <option label={displayName} value={id} key={id}/>
                    )
                )}
            </select>
        </div>
    )
}
export default ProgramStageComponent
