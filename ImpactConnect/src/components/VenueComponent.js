import { useDataEngine } from '@dhis2/app-runtime';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { VENUE_NAME } from '../consts.js';

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
                <select className="select"
                        value={selectedLevel2}
                        onChange={(event) => {
                            venueSelected('');
                            const selected = event.target.value;
                            setLevel3OrgUnits([]);
                            updateOrgUnits(3, selected);
                            setSelectedLevel3('');
                            setSelectedLevel4('');
                            setSelectedLevel2(selected);
                        }}>
                    {loading && level2OrgUnits.length === 0 ? (
                        <option>Loading...</option>
                    ) : (
                        <>
                            <option defaultValue={''}>Select Province</option>
                            {level2OrgUnits.sort((o1, o2) => o1?.displayName?.localeCompare(o2?.displayName)).map(option => (
                                <option key={option.id} value={option.id}>
                                    {option.displayName}
                                </option>
                            ))}
                        </>
                    )}
                </select>
            </div>
            {selectedLevel2 &&
                <div className="flex flex-row">
                    <select className="select"
                            value={selectedLevel3}
                            onChange={(event) => {
                                venueSelected('');
                                const selected = event.target.value;
                                setLevel4OrgUnits([]);
                                updateOrgUnits(4, selected);
                                setSelectedLevel4('');
                                setSelectedLevel3(selected);
                            }}>
                        {loading && level3OrgUnits.length === 0 ? (
                            <option>Loading...</option>
                        ) : (
                            <>
                                <option defaultValue={''}>Select District</option>
                                {level3OrgUnits.sort((o1, o2) => o1?.displayName?.localeCompare(o2?.displayName)).map(option => (
                                    <option key={option.id} value={option.id}>
                                        {option.displayName}
                                    </option>
                                ))}
                            </>
                        )}
                    </select>
                </div>
            }
            {selectedLevel3 &&
                <div className="flex flex-row">
                    <select className="select"
                            value={selectedLevel4}
                            onChange={(event) => {
                                venueSelected('');
                                const selected = event.target.value;
                                setLevel5OrgUnits([]);
                                updateOrgUnits(5, selected);
                                setSelectedLevel4(selected);
                            }}>
                        {loading && level4OrgUnits.length === 0 ? (
                            <option>Loading...</option>
                        ) : (
                            <>
                                <option defaultValue={''}>Select Sector</option>
                                {level4OrgUnits.sort((o1, o2) => o1?.displayName?.localeCompare(o2?.displayName)).map(option => (
                                    <option key={option.id} value={option.id}>
                                        {option.displayName}
                                    </option>
                                ))}
                            </>
                        )}
                    </select>
                </div>
            }
            {selectedLevel4 &&
                <div className="flex flex-row">
                    <select className="select"
                            value={selectedLevel5}
                            onChange={(event) => {
                                const selected = event.target.value;
                                venueSelected(selected);
                                setSelectedLevel5(selected);
                            }}>
                        {loading && level5OrgUnits.length === 0 ? (
                            <option>Loading...</option>
                        ) : (
                            <>
                                <option defaultValue={''}>Select Venue</option>
                                {level5OrgUnits.sort((o1, o2) => o1?.displayName?.localeCompare(o2?.displayName)).map(option => (
                                    <option key={option.id} value={option.id}>
                                        {option.displayName}
                                    </option>
                                ))}
                            </>
                        )}
                    </select>
                </div>
            }
        </div>
    </>
}
VenueComponent.propTypes = {
    venueSelected: PropTypes.func
}
