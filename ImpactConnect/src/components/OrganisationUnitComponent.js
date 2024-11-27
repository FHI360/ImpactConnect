import { useDataQuery } from '@dhis2/app-runtime'
import { OrganisationUnitTree } from '@dhis2-ui/organisation-unit-tree'
import React, { useEffect, useState } from 'react'

const query = {
    results: {
        resource: 'organisationUnits',
        params: {
            fields: "id,name,level,displayShortName",
            filter: ['level:eq:2', 'organisationUnitGroups.name:eq:Schools']
        }
    }
}


const OrganisationUnitComponent = ({handleOUChange, selectedOU}) => {
    const [root, setRoot] = useState([])
    const {loading, error, data} = useDataQuery(query)

    useEffect(() => {
        if (data?.results?.organisationUnits) {
            const root = data.results.organisationUnits.flatMap((_, idx) => {
                return [data['results']['organisationUnits'][idx]['id']]
            });
            setRoot(root);
        }
    }, [data])

    if (error) {
        return <span>ERROR: {error.message}</span>
    }

    if (loading) {
        return <span>Loading...</span>
    }

    return (
        <div>
            <div>
                {root.length > 0 &&
                    <OrganisationUnitTree
                        name={data['results']['organisationUnits'][0]['name']}
                        onChange={handleOUChange}
                        roots={root}
                        selected={selectedOU}
                        singleSelection={true}
                    />
                }
            </div>
        </div>
    )
}

export default OrganisationUnitComponent
