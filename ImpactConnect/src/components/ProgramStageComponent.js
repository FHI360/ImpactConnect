import { useDataQuery } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n';
import PropTypes from 'prop-types';
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

const ProgramStageComponent = ({selectedProgram, selectedStage, setSelectedStage, filteredStages = []}) => {
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
            <label htmlFor="stage" className="label">
                {i18n.t('Select program stage')}
            </label>
            <select id="stage"
                    className="select"
                    value={selectedStage}
                    onChange={handleStageChange}>
                <option selected>Choose a program stage</option>
                {data?.programStages?.programStages?.filter(s => !(filteredStages || []).includes(s.id)).map(({id, displayName}) => (
                        <option label={displayName} value={id} key={id}/>
                    )
                )}
            </select>
        </div>
    )
}
export default ProgramStageComponent;

ProgramStageComponent.propTypes = {
    filteredStages: PropTypes.array,
    selectedProgram: PropTypes.string,
    selectedStage: PropTypes.string,
    setSelectedStage: PropTypes.func
}
