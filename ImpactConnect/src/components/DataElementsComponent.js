import PropTypes from 'prop-types';
import React from 'react';
import { DataElementComponent } from './DataElement.js';

export const DataElementsComponent = React.memo(({
                                                     data,
                                                     valueChange,
                                                     setEditingOption,
                                                     disable,
                                                     configuredCondition,
                                                     setInvalid,
                                                     values,
                                                     editOnly,
                                                     stage,
                                                     optionRenamed = (oldName, newName) => {
                                                     }
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
                                                  conditions={configuredCondition}
                                                  setEditingOption={setEditingOption}
                                                  readonly={disable}
                                                  values={values}
                                                  setInvalid={setInvalid}
                                                  stage={stage}
                                                  editOnly={editOnly}
                                                  optionRenamed={optionRenamed}
                                                  valueChanged={valueChange}/>
                        </div>
                    </>
                }
            })}
        </>
    )
});

DataElementsComponent.propTypes = {
    configuredCondition: PropTypes.array,
    data: PropTypes.object,
    disable: PropTypes.bool,
    editOnly: PropTypes.bool,
    optionRenamed: PropTypes.func,
    setEditingOption: PropTypes.func,
    setInvalid: PropTypes.func,
    stage: PropTypes.string,
    valueChange: PropTypes.func,
    values: PropTypes.object
};
