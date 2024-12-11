export const config = {
    dataStoreName: 'impact-project-definition',
    dataStoreSearchHistory: 'sherlock-search-history',
    dataStoreKey: 'tunozegusoma'
}

export const ProjectsFiltersMore = 'fields=key,projectName,programid,attributesSelected,selectedOU,fullOrgUnitSearch';
export const SearchHistory = 'fields=key,programid,projectName,attributesSelected,fullOrgUnitSearch,modifiedDate,selectedOU,ProgramName'
export const dataStoreQueryMore = {
    dataStore: {
        resource: `dataStore/${config.dataStoreName}?${ProjectsFiltersMore}&paging=false`,
    },
}
export const dataStoreSearchHistoryQueryMore = {
    dataStore: {
        resource: `dataStore/${config.dataStoreSearchHistory}?${SearchHistory}&paging=false`,
    },
}


export const MainTitle = 'Tunozegusoma'
export const ProjectAttributedescription = 'Project Attribute'
export const searchBoundarySelected = 'Search Selected Organization Unit Tree'
export const searchBoundaryfull = 'Search Full Organization Unit Tree'
const version = 'Version v1.0.0 | Beta 20-08-2024'
export const footerText = `Copyright © FHI360 | EpiC | Business Solutions | 2024 | ${version}`
export const project_description = 'This application resolves duplicate issues'
export const panelAction = 'Finding duplicate tracked entities'

export const VENUE_NAME = 'Training/Meeting/Workshop Venues';
export const MEL_TEAM = 'MEL Team';
export const TRAINING_STAGES = {
    TRAINING: 'SmUprI011oN',
    WORKSHOP: 'rPMeg1cK9Pu',
    MEETING: 'jMKha9exruT'
}
export const ACTIVITY_STAGE_MAPPING = {
    1: TRAINING_STAGES.TRAINING,
    2: TRAINING_STAGES.WORKSHOP,
    3: TRAINING_STAGES.MEETING,
}

export const EVENT_OPTIONS = {
    attributes: {
        startDate: 'CUW9TfQpAu6',
        endDate: 'KPwanQQE4FU',
        activity: 'G0Ab3IHVx6W',
        days: 'oIZRuzzHXxa',
        event: 'CJ7g6K9Ukvf',
        facilitators: 'WSOC4pHc34X',
        uniqueName: 'rlCta8FG2fz'
    },
    relationshipType: 'iBFMyo4S0Nn',
    stageMapping: [
        {
            id: TRAINING_STAGES.TRAINING,
            mappings: {
                CUW9TfQpAu6: 'uaQMciOOeWp', //start date
                KPwanQQE4FU: 'ydubZaoEeMy', //end date
                CJ7g6K9Ukvf: 'UfMZ6XN7PS7', //Event Name
                rlCta8FG2fz: 'e0RUQ4dgkgL', //Unique name
                d0xv61F97Xl: 'PkzWUbbUvZJ',//USG support
                P1ftkrnpQcf: '',//Event Objective
                oIZRuzzHXxa: 'UXOKSlNdcCE'//Number of days
            },
            days: {
                1: 'xC0qvYXW3kB',
                2: 'NOA57B7ry6m',
                3: 'wnlNJ6YXPEB',
                4: 'wiy7OJe82vw',
                5: 'Zl2C1J82Iko',
                6: 'swP5ko96SyC',
                7: 'pb3dozumaA9',
                8: 'nz0xDT9pdgw',
                9: 'SdP4s8SRDX1',
                10: 'aX5CYDBVHBF'
            },
            venue: 'nr2KeppSpJu'
        },
        {
            id: TRAINING_STAGES.WORKSHOP,
            mappings: {
                CUW9TfQpAu6: 'ihlx9umjUrk', //start date
                KPwanQQE4FU: 'MD17WLZCEUc', //end date
                CJ7g6K9Ukvf: 'PUvwjqxunXb', //Event Name
                rlCta8FG2fz: 'a7zycuo6jJL', //Unique name
                d0xv61F97Xl: 'V6NrrxNfZIQ',//USG support
                P1ftkrnpQcf: '',//Event Objective
                oIZRuzzHXxa: 'kXSUG9Aortq'//Number of days
            },
            days: {
                1: 'wvJiMvzGI6D',
                2: 'DNHZpZ90ABq',
                3: 'UL0yoJHUOWM',
                4: 'p1YAn2bS73C',
                5: 'rHhNj1yzeJy',
                6: 'nlgSqr5SWO8',
                7: 'lA28WkTREhj',
                8: 'RsJHkrx1Kix',
                9: 'e62s5XIxZ8Z',
                10: 'cxjrWicpNUA'
            },
            venue: 'HzFrujoVvp4'
        },
        {
            id: TRAINING_STAGES.MEETING,
            mappings: {
                CUW9TfQpAu6: 'Hv7qEISyGje', //start date
                KPwanQQE4FU: 'vIIrVbFoWmO', //end date
                CJ7g6K9Ukvf: 'QGsrhVuN3sC', //Event Name
                rlCta8FG2fz: 'ZmZy7A1Gfmc', //Unique name
                d0xv61F97Xl: 'TORvO3CI2l1',//USG support
                P1ftkrnpQcf: '',//Event Objective
                oIZRuzzHXxa: 'iXQ6CnBP0Qi'//Number of days
            },
            days: {
                1: 'h4fqkmMaXTF',
                2: 'jmaZu41ixHK',
                3: 'CySpWjKo9K6',
                4: 'MtlQTkOeNM8',
                5: 'z8lxVSkcqbo',
                6: 'zMrF9rXtGlq',
                7: 'NUJP6crsVnU',
                8: 'JRwbsqHB9du',
                9: 'PnHYe0lQsXF',
                10: 'ENpSRYFyYWe'
            },
            venue: 'rMxu6V1U2oZ'
        }
    ]
}

export const REPORT = {
    PHONE: 'ls0TZ2qIQY4',
    GENDER: 'RFDW6SognD1',
    POSITION: 'GT99Xd3kyVN'
}
