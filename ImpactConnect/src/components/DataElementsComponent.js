import PropTypes from 'prop-types';
import React from 'react';
import { DataElementComponent } from './DataElement.js';

export const DataElementsComponent = React.memo(({
                                                     data, valueChange, setEditingOption, disable
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
                                                  setEditingOption={setEditingOption}
                                                  readonly={disable}
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
    disable: PropTypes.bool,
    setEditingOption: PropTypes.func,
    valueChange: PropTypes.func,
};
