import { useDataEngine } from '@dhis2/app-runtime';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { VENUE_NAME } from '../consts.js';
import { SingleSelectField } from '@dhis2/ui';
import { SingleSelectOption } from '@dhis2-ui/select';

export const VenueComponent = ({
                                   venueSelected = (_) => {
                                   }
                               }) => {
    const engine = useDataEngine();
    const [level2OrgUnits, setLevel2OrgUnits] = useState([]);
    const [level3OrgUnits, setLevel3OrgUnits] = useState([]);
    const [level4OrgUnits, setLevel4OrgUnits] = useState([]);
    const [level5OrgUnits, setLevel5OrgUnits] = useState([]);
    const [selectedLevel2, setSelectedLevel2] = useState('');
    const [selectedLevel3, setSelectedLevel3] = useState('');
    const [selectedLevel4, setSelectedLevel4] = useState('');
    const [selectedLevel5, setSelectedLevel5] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (level2OrgUnits.length <= 0) {
            updateOrgUnits(2);
        }
    }, [level2OrgUnits]);

    const updateOrgUnits = (level, parent) => {
        let resource = 'organisationUnits';
        const params = {
            fields: 'id,level,displayName,organisationUnitGroups(name)',
        }
        if (!parent) {
            params.filter = ['level:eq:2', 'organisationUnitGroups.name:eq:Schools']
        } else {
            params.fields = params.fields + ',children(id,displayName,organisationUnitGroups(name))';
            resource = `${resource}/${parent}`
        }
        const query = {
            orgUnits: {
                resource,
                params
            }
        }

        setLoading(true);
        engine.query(query).then(res => {

            let orgUnits = res.orgUnits.organisationUnits || res.orgUnits.children;
            if (level === 2) {
                setLevel2OrgUnits(orgUnits);
            } else if (level === 3) {
                setLevel3OrgUnits(orgUnits)
            } else if (level === 4) {
                setLevel4OrgUnits(orgUnits);
            } else if (level === 5) {
                orgUnits = orgUnits.filter(ou => ou.organisationUnitGroups.some(oug => oug.name === VENUE_NAME))
                setLevel5OrgUnits(orgUnits)
            }
            setLoading(false);
        });
    }

    return <>
        <div className="flex flex-col gap-y-2">
            <div className="flex flex-row">
                <SingleSelectField
                    selected={selectedLevel2}
                    loading={loading && level2OrgUnits.length === 0}
                    clearable={true}
                    className='w-full'
                    placeholder={'Select Province'}
                    filterable={true}
                    onChange={(event) => {
                        venueSelected('');
                        const selected = event.selected;
                        setLevel3OrgUnits([]);
                        updateOrgUnits(3, selected);
                        setSelectedLevel3('');
                        setSelectedLevel4('');
                        setSelectedLevel2(selected);
                    }}>
                    {level2OrgUnits.sort((o1, o2) => o1?.displayName?.localeCompare(o2?.displayName)).map(option => (
                        <SingleSelectOption key={option.id} value={option.id} label={option.displayName}>
                        </SingleSelectOption>
                    ))}
                </SingleSelectField>
            </div>
            {selectedLevel2 &&
                <div className="flex flex-row">
                    <SingleSelectField
                        className="w-full"
                        selected={selectedLevel3}
                        clearable={true}
                        placeholder={'Select District'}
                        filterable={true}
                        loading={loading && level3OrgUnits.length === 0}
                        onChange={(event) => {
                            venueSelected('');
                            const selected = event.selected;
                            setLevel4OrgUnits([]);
                            updateOrgUnits(4, selected);
                            setSelectedLevel4('');
                            setSelectedLevel3(selected);
                        }}>
                        {level3OrgUnits.sort((o1, o2) => o1?.displayName?.localeCompare(o2?.displayName)).map(option => (
                            <SingleSelectOption key={option.id} value={option.id} label={option.displayName}>
                            </SingleSelectOption>
                        ))}
                    </SingleSelectField>
                </div>
            }
            {selectedLevel3 &&
                <div className="flex flex-row">
                    <SingleSelectField
                        className="w-full"
                        selected={selectedLevel4}
                        placeholder={'Select Sector'}
                        loading={loading && level4OrgUnits.length === 0}
                        clearable={true}
                        filterable={true}
                        onChange={(event) => {
                            venueSelected('');
                            const selected = event.selected;
                            setLevel5OrgUnits([]);
                            updateOrgUnits(5, selected);
                            setSelectedLevel4(selected);
                            setSelectedLevel5('')
                        }}>
                        {level4OrgUnits.sort((o1, o2) => o1?.displayName?.localeCompare(o2?.displayName)).map(option => (
                            <SingleSelectOption key={option.id} value={option.id} label={option.displayName}>
                            </SingleSelectOption>
                        ))}
                    </SingleSelectField>
                </div>
            }
            {selectedLevel4 &&
                <div className="flex flex-row">
                    <SingleSelectField
                        className="w-full"
                        selected={selectedLevel5}
                        placeholder={'Select Venue'}
                        clearable={true}
                        filterable={true}
                        loading={loading && level5OrgUnits.length === 0}
                        onChange={(event) => {
                            const selected = event.selected;
                            venueSelected(selected);
                            setSelectedLevel5(selected);
                        }}>
                        {level5OrgUnits.sort((o1, o2) => o1?.displayName?.localeCompare(o2?.displayName)).map(option => (
                            <SingleSelectOption key={option.id} value={option.id} label={option.displayName}>
                            </SingleSelectOption>
                        ))}
                    </SingleSelectField>
                </div>
            }
        </div>
    </>
}
VenueComponent.propTypes = {
    venueSelected: PropTypes.func
}
