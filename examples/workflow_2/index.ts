import { v4 as uuidv4 } from "uuid";

import Nishan, {ILinkedDBInput, IPageCreateInput} from '../../packages/core/dist/Nishan';

import "../env"

import { fors, categories, subject } from "../data";


async function main() {
  const nishan = new Nishan({
    token: process.env.NOTION_TOKEN as string,
    interval: 500,
  });

  // Get your own notion user and space
  const user = await nishan.getNotionUser((user) => user.family_name === 'Shaheer');
  const space = await user.getSpace((space) => space.name === 'Developer');

  type root_cvp_titles_type = "Tasks" | "Articles" | "Reading List" | "Course List" | "Goals";

  const root_cvp_titles = ["Tasks", "Articles", "Reading List", "Course List", "Goals"] as root_cvp_titles_type[];

  const collection_ids: Record<root_cvp_titles_type, string> = {} as any;

  await space.getRootCollections((collection) => {
    const index = root_cvp_titles.indexOf(collection.name[0][0] as any);
    if (index !== -1) collection_ids[collection?.name[0][0] as root_cvp_titles_type] = collection.id;
  })

  function createLinkedDB(key: root_cvp_titles_type, _for: "EBooks" | "Courses", title: string) {
    return {
      type: "linked_db",
      collection_id: collection_ids[key],
      views: [
        ["To Complete", "Learn"], ["Completing", "Learn"], ["Completed", "Learn"],
        ["To Complete", "Revise"], ["Completing", "Revise"], ["Completed", "Revise"],
        ["To Complete", "Practice"], ["Completing", "Practice"], ["Completed", "Practice"]
      ].map(([status, phase]) => (
        {
          type: "gallery",
          name: `${status} ${phase} ${_for}`,
          gallery_cover: { property: "Cover", type: "property" },
          view: [
            {
              type: "title",
              name: "Name",
              sort: "ascending"
            },
            {
              type: "text",
              name: "Instructor"
            },
            {
              type: "select",
              name: "Publisher"
            },
            {
              type: "multi_select",
              name: "Subject",
              filter: [["enum_contains", "exact", title]]
            },
            {
              name: "Status",
              type: "select",
              format: false,
              filter: [["enum_is", "exact", status as any]]
            },
            {
              name: "Phase",
              type: "select",
              format: false,
              filter: [["enum_is", "exact", phase as any]]
            },
            {
              name: "Priority",
              type: "select",
            },
            {
              type: "formula",
              sort: ["descending", 0],
              format: false,
              name: "Urgency",
            }
          ]
        })
      )
    } as ILinkedDBInput
  }

  function returnSubjectSlice(start: number, end: number) {
    return subject.slice(start, end).map(({ for: _for, image, title, category }) => (
      {
        format: {
          page_icon: image,
          page_full_width: true,
        },
        properties: {
          title: [[title]],
          category: [[category.join(",")]],
          for: [[_for?.join(",") ?? ""]],
        },
        contents: [
          {
            type: "linked_db",
            collection_id: collection_ids.Goals,
            views: [
              {
                type: "table",
                name: "Current Goals",
                view: [
                  {
                    type: "date",
                    name: "Created",
                    format: 200
                  },
                  {
                    type: "formula",
                    name: "Progress",
                    format: 100,
                    aggregation: "average",
                  },
                  {
                    type: "title",
                    name: "Goal",
                    aggregation: "count",
                    format: 300
                  },
                  {
                    type: "multi_select",
                    name: "Purpose",
                    aggregation: "unique",
                    format: 100
                  },
                  {
                    type: "multi_select",
                    name: "Subject",
                    aggregation: "unique",
                    format: 250,
                    filter: [["enum_contains", "exact", title]]
                  },
                  {
                    type: "multi_select",
                    name: "Source",
                    aggregation: "unique",
                    format: 100
                  },
                  {
                    type: "rollup",
                    name: "Total Tasks",
                    format: 100,
                    aggregation: "sum",
                  },
                  {
                    type: "rollup",
                    name: "Completed",
                    format: 100,
                    aggregation: "sum"
                  },
                  {
                    type: "number",
                    name: "Steps",
                    format: 100,
                    aggregation: "sum"
                  },
                  {
                    type: "select",
                    name: "Status",
                    format: false,
                    filter: [["enum_is", "exact", "Completing"]]
                  },
                  {
                    type: "number",
                    name: "Progress",
                    sort: "descending",
                    format: false,
                    filter: [["number_does_not_equal", "exact", 100]]
                  },
                ]
              },
              {
                type: "table",
                name: "Completed Goals",
                view: [
                  {
                    type: "date",
                    name: "Created",
                    format: 200
                  },
                  {
                    type: "date",
                    name: "Completed At",
                    format: 150
                  },
                  {
                    type: "title",
                    name: "Goal",
                    aggregation: "count",
                    format: 300
                  },
                  {
                    type: "multi_select",
                    name: "Purpose",
                    aggregation: "unique",
                    format: 100
                  },
                  {
                    type: "multi_select",
                    name: "Subject",
                    aggregation: "unique",
                    format: 250,
                    filter: [["enum_contains", "exact", title]]
                  },
                  {
                    type: "multi_select",
                    name: "Source",
                    aggregation: "unique",
                    format: 100
                  },
                  {
                    type: "rollup",
                    name: "Total Tasks",
                    format: 100,
                    aggregation: "sum",
                  },
                  {
                    type: "number",
                    name: "Steps",
                    format: 100,
                    aggregation: "sum"
                  },
                  {
                    type: "select",
                    name: "Status",
                    format: false,
                    filter: [["enum_is", "exact", "Completed"]]
                  },
                  {
                    type: "number",
                    name: "Progress",
                    sort: "descending",
                    format: false,
                    filter: [["number_equals", "exact", 100]]
                  },
                ]
              }
            ]
          },
          createLinkedDB("Course List", "Courses", title),
          createLinkedDB("Reading List", "EBooks", title),
          {
            type: "linked_db",
            collection_id: collection_ids.Articles,
            views: [
              {
                type: "table",
                name: "Article Table",
                view: [
                  {
                    type: "title",
                    name: "Title",
                    aggregation: "count"
                  },
                  {
                    type: "formula",
                    name: "Urgency",
                    sort: "ascending",
                    format: 50
                  },
                  {
                    type: "checkbox",
                    name: "Completed",
                    format: 100,
                    aggregation: "percent_checked"
                  },
                  {
                    type: "multi_select",
                    name: "Subject",
                    format: 200,
                    filter: [["enum_contains", "exact", title]]
                  },
                  {
                    type: "select",
                    name: "Provider",
                    aggregation: "unique",
                    format: 150
                  },
                  {
                    type: "url",
                    name: "Source",
                    format: 300
                  },
                  ...["Priority", "Status", "Phase"].map((name) => ({ type: "select" as any, name, format: 150 })) as any,
                  ...["Learn", "Revise", "Practice"].map((name) => ({ type: "date" as any, name: `${name} Range`, format: 150, aggregation: "percent_not_empty", })) as any,
                ]
              }
            ]
          },
          {
            type: "linked_db",
            collection_id: collection_ids.Tasks,
            views: [
              {
                type: "table",
                name: "Task Table",
                view: [
                  {
                    type: "date",
                    name: "On",
                    sort: "descending",
                    format: [true, 250]
                  },
                  {
                    type: "title",
                    name: "Task",
                    format: [true, 250],
                    aggregation: "count"
                  },
                  { name: "Purpose", type: "select", format: [true, 100], aggregation: "unique" },
                  { name: "Source", type: "select", format: [true, 100], aggregation: "unique" },
                  { name: "Subject", type: "multi_select", aggregation: "unique", filter: [["enum_contains", "exact", title]] },
                  { name: "Goals", type: "relation", format: [true, 300], aggregation: "count" },
                  { name: "Steps", type: "number", format: [true, 50], aggregation: "sum" },
                  { name: "Created", type: "created_time", format: false },
                  { name: "Custom", type: "formula", format: false },
                ]
              }
            ]
          },
        ]
      } as Omit<IPageCreateInput, "type">))
  }

  const { collection_view_page } = await space.createTRootPages([{
    type: "collection_view_page",
    properties: {
      title: [["Web 3.0"]]
    },
    format: {
      page_icon: "https://notion-emojis.s3-us-west-2.amazonaws.com/v0/svg-twitter/1f310.svg"
    },
    schema: [{ name: "Title", type: "title" }, { name: "Competency", type: "number" }, { name: "Category", type: "multi_select", options: categories.map(([value, color]) => ({ value, color, id: uuidv4() })) }, { name: "For", type: "multi_select", options: fors.map(([value, color]) => ({ value, color, id: uuidv4() })) }],
    views: [
      {
        type: "table",
        name: "Overview",
        view: [{
          type: "text",
          name: "Title",
          sort: ["ascending", 0],
          aggregation: "count",
          format: 250
        }, {
          type: "number",
          name: "Competency",
          format: 50,
          aggregation: "average",
        }, {
          type: "multi_select",
          name: "Category",
          sort: "ascending",
          format: 200
        }, {
          type: "multi_select",
          name: "For",
          format: 200
        }]
      }
    ]
  }])

  const tota_batch = Math.floor(subject.length / 10);

  for (let index = 0; index <= tota_batch; index++) {
    const start = (10 * index) + 1, end = start + 9;
    await collection_view_page[0].collection.createPages(returnSubjectSlice(start, end));
    console.log(`Deployed batch ${index + 1}`);
  }
}
main();