import PropTypes from 'prop-types';
import React from 'react';
import { DataElementComponent } from './DataElement.js';

export const DataElementsComponent = React.memo(({
                                                     data, valueChange
                                                 }) => {
    return (
        <>
            {data.trainingAttributes.map((cde, idx) => {
                const de = data.trainingAttributesData.find(ta => ta.id === cde);
                if (de && cde !== data.eventNameAttribute) {
                    return <>
                        <div className="w-full p-2">
                            <DataElementComponent key={idx}
                                                  value={data.groupValues[cde]}
                                                  dataElement={de}
                                                  labelVisible={true}
                                                  valueChanged={valueChange}/>
                        </div>
                    </>
                }
            })}
        </>
    )
});

DataElementsComponent.propTypes = {
    data: PropTypes.object,
    valueChange: PropTypes.func,
};
