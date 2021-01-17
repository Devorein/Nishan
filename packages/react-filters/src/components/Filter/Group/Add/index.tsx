import { IViewFilter } from "@nishans/types";
import React from "react";
import { returnEmptyFilter, returnEmptyFilterGroup } from "../../../../utils/createFilterLiterals";
import { BasicSelect } from "../../../Shared";

interface Props {
  addFilter: React.Dispatch<React.SetStateAction<IViewFilter>>
}

export default function FilterGroupAdd(props: Props) {
  return <div className="NotionFilter-Group-Add">
    <BasicSelect label={"Add a filter"} value={""} onChange={(e) => {
      switch (e.target.value) {
        case "filter":
          props.addFilter(current_filters => {
            current_filters.filters.push(returnEmptyFilter())
            return current_filters;
          })
          break;
        case "filter_group":
          props.addFilter(current_filters => {
            current_filters.filters.push(returnEmptyFilterGroup())
            return current_filters;
          })
          break;
      }
    }} items={[{ label: "Add a filter", value: "filter" }, { label: "Add a filter group", value: "filter_group" }]} />
  </div>
}