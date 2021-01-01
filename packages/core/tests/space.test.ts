import { Space } from "../dist/api";
import { ITPage } from "../dist/types";
import {nishan, ROOT_COLLECTION_VIEW_PAGE_ONE_ID, USER_ONE_ID, SPACE_ONE_ID, ROOT_PAGE_ONE_ID} from "./constants"

let space: Space = null as any;

beforeAll(async ()=>{
  const user = await nishan.getNotionUser(USER_ONE_ID);
  space = await user.getSpace(SPACE_ONE_ID);
})

function checkRootPages(pages: ITPage, status?:boolean){
  status = status ?? true;
  if(status){
    expect(pages.page.length).toBe(1);
    expect(pages.page[0]).not.toBeNull();
    expect(pages.page[0].id).toBe(ROOT_PAGE_ONE_ID);
    expect(pages.page[0].type).toBe("block");
  }else{
    expect(pages.page.length).toBe(0);
    expect(pages.page[0]).toBeUndefined();
  }
}

function checkRootCollectionViewPages(pages: ITPage, status?:boolean){
  status = status ?? true;
  if(status){
    expect(pages.collection_view_page.length).toBe(1);
    expect(pages.collection_view_page[0]).not.toBeNull();
    expect(pages.collection_view_page[0].id).toBe(ROOT_COLLECTION_VIEW_PAGE_ONE_ID);
    expect(pages.collection_view_page[0].type).toBe("block");
  }else{
    expect(pages.collection_view_page.length).toBe(0);
    expect(pages.collection_view_page[0]).toBeUndefined();
  }
}

it("Get root_page id", async ()=>{
  checkRootPages(await space.getTRootPage(ROOT_PAGE_ONE_ID))
})

it("!Get root_page !id", async ()=>{
  checkRootPages(await space.getTRootPage(ROOT_PAGE_ONE_ID.slice(1)), false)
})

it("Get [root_page] [id]", async ()=>{
  checkRootPages(await space.getTRootPages([ROOT_PAGE_ONE_ID]));
})

it("!Get [root_page] ![id]", async ()=>{
  checkRootPages(await space.getTRootPages([ROOT_PAGE_ONE_ID.slice(1)]), false);
})

it("Get root_page cb", async ()=>{
  checkRootPages(await space.getTRootPage(root_page=>root_page.id === ROOT_PAGE_ONE_ID));
})

it("!Get root_page !cb", async ()=>{
  checkRootPages(await space.getTRootPage(root_page=>root_page.id === ROOT_PAGE_ONE_ID.slice(1)), false);
})

it("Get [root_page] cb.id", async ()=>{
  checkRootPages(await space.getTRootPages(root_page=>root_page.id === ROOT_PAGE_ONE_ID));
})

it("Get [root_page] cb.type", async ()=>{
  checkRootPages(await space.getTRootPages(root_page=>root_page.type === "page"));
})

it("Get [root_page] undefined", async ()=>{
  checkRootPages(await space.getTRootPages());
})

it("!Get [root_page] !cb", async ()=>{
  checkRootPages(await space.getTRootPages(root_page=>root_page.id === ROOT_PAGE_ONE_ID.slice(1)), false);
})


it("Get root_cvp id", async ()=>{
  checkRootCollectionViewPages(await space.getTRootPage(ROOT_COLLECTION_VIEW_PAGE_ONE_ID))
})

it("!Get root_cvp !id", async ()=>{
  checkRootCollectionViewPages(await space.getTRootPage(ROOT_COLLECTION_VIEW_PAGE_ONE_ID.slice(1)), false)
})

it("Get [root_cvp] [id]", async ()=>{
  checkRootCollectionViewPages(await space.getTRootPages([ROOT_COLLECTION_VIEW_PAGE_ONE_ID]));
})

it("!Get [root_cvp] ![id]", async ()=>{
  checkRootCollectionViewPages(await space.getTRootPages([ROOT_COLLECTION_VIEW_PAGE_ONE_ID.slice(1)]), false);
})

it("Get root_cvp cb", async ()=>{
  checkRootCollectionViewPages(await space.getTRootPage(root_cvp=>root_cvp.id === ROOT_COLLECTION_VIEW_PAGE_ONE_ID));
})

it("!Get root_cvp !cb", async ()=>{
  checkRootCollectionViewPages(await space.getTRootPage(root_cvp=>root_cvp.id === ROOT_COLLECTION_VIEW_PAGE_ONE_ID.slice(1)), false);
})

it("Get [root_cvp] cb.id", async ()=>{
  checkRootCollectionViewPages(await space.getTRootPages(root_cvp=>root_cvp.id === ROOT_COLLECTION_VIEW_PAGE_ONE_ID));
})

it("Get [root_cvp] cb.type", async ()=>{
  checkRootCollectionViewPages(await space.getTRootPages(root_cvp=>root_cvp.type === "collection_view_page"));
})

it("Get [root_cvp] undefined", async ()=>{
  checkRootCollectionViewPages(await space.getTRootPages());
})

it("!Get [root_cvp] !cb", async ()=>{
  checkRootCollectionViewPages(await space.getTRootPages(root_cvp=>root_cvp.id === ROOT_COLLECTION_VIEW_PAGE_ONE_ID.slice(1)), false);
})