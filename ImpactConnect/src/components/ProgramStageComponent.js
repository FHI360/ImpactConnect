import { useDataQuery } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react'
import { SingleSelectField } from '@dhis2/ui';
import { SingleSelectOption } from '@dhis2-ui/select';

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
        setSelectedStage(event.selected);
    };
    return (
        <div>
            <label htmlFor="stage" className="label">
                {i18n.t('Select program stage')}
            </label>
            <SingleSelectField
                id="stage"
                className="w-full"
                clearable={true}
                filterable={true}
                placeholder={'Choose a program stage'}
                selected={selectedStage}
                onChange={handleStageChange}>
                {data?.programStages?.programStages?.filter(s => !(filteredStages || [])
                    .includes(s.id)).map(({
                                              id,
                                              displayName
                                          }) => (
                        <SingleSelectOption label={displayName} value={id} key={id}/>
                    )
                )}
            </SingleSelectField>
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
