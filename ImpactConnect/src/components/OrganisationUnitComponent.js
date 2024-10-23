import { useDataQuery } from '@dhis2/app-runtime'
import { OrganisationUnitTree } from '@dhis2-ui/organisation-unit-tree'
import React from 'react'

const query = {
    results:{
        resource: 'organisationUnits',
        params: {
            fields: "id,name,level,displayShortName",
            filter: 'level:eq:1'
        }
    }
}


const OrganisationUnitComponent = ({ handleOUChange, selectedOU }) => {
    const { loading, error, data } = useDataQuery(query)

    if (error) {
        return <span>ERROR: {error.message}</span>
    }

    if (loading) {
        return <span>Loading...</span>
    }

    return (
        <div>
            <div>
                <OrganisationUnitTree
                    name={data['results']['organisationUnits'][0]['name']}
                    onChange={handleOUChange}
                    roots={[data['results']['organisationUnits'][0]['id']]}
                    selected={selectedOU}
                    singleSelection={true}
                />
            </div>
        </div>
    )
}

export default OrganisationUnitComponent
