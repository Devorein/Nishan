
import { IUserPermission, ISpacePermission, ViewAggregations, IMember, ICredit, ICollectionView, ICollectionViewPage, TBlock, ICollection, MediaFormat, TPlanType, Node, TOperationTable, IPermission, Cursor, IBoardView, ICalendarView, IGalleryView, IListView, ITableView, CreateProps, LastEditedProps, TLocale, Account, Token, GoogleDriveFile, TGenericEmbedBlockType, TPermissionRole, IViewFilter, ViewSorts } from "./";
export interface SetPageNotificationsAsReadParams {
  navigableBlockId: string,
  spaceId: string,
  timestamp: number
}

export interface SetSpaceNotificationsAsReadParams {
  spaceId: string,
  timestamp: number
}

export interface GetPageVisitsParams {
  blockId: string,
  limit: number
}

export interface GetPageVisitsResult {
  recordMap: {
    page_visits: BlockData
  }
}

export interface GetUserSharedPagesResult {
  includeDeleted: boolean
}

export interface GetUserSharedPagesParams {
  pages: { id: string, spaceId: string }[],
  recordMap: {
    block: BlockData,
    space: SpaceData
  }
}

export interface GetPublicPageDataParams {
  // Id of the block
  blockId: string,
  name: "page",
  saveParent: boolean
  showMoveTo: boolean
  type: "block-space"
}

export interface GetPublicPageDataResult {
  betaEnabled: boolean
  canJoinSpace: boolean
  canRequestAccess: boolean
  hasPublicAccess: boolean
  icon: string
  ownerUserId: string
  spaceId: string
  spaceName: string
  userHasExplicitAccess: boolean
}

export interface GetPublicSpaceDataParams {
  type: 'space-ids',
  spaceIds: string[]
}

export interface GetPublicSpaceDataResult {
  results: SpaceDataResult[]
}

export interface SpaceDataResult {
  createdTime: number
  disableExport: boolean
  disableGuests: boolean
  disableMoveToSpace: boolean
  disablePublicAccess: boolean
  icon: string
  id: string
  inviteLinkEnabled: boolean
  memberCount: number
  name: string
  planType: TPlanType
  shardId: number
}

export interface GetSubscriptionDataParams {
  spaceId: string
}

export interface GetSubscriptionDataResult {
  accountBalance: number,
  availableCredit: number
  blockUsage: number
  bots: string[]
  creditEnabled: boolean,
  hasPaidNonzero: boolean
  isDelinquent: boolean
  isSubscribed: boolean
  joinedMemberIds: string[]
  credits: ICredit[]
  members: IMember[]
  spaceUsers: string[]
  totalCredit: number
  type: "unsubscribed_admin"
}

export interface RemoveUsersFromSpaceParams {
  removePagePermissions: boolean
  revokeUserTokens: boolean
  spaceId: string
  userIds: string[]
}

export interface RemoveUsersFromSpaceResult {
  recordMap: {
    block: BlockData,
    space: SpaceData
  }
}

export interface InitializePageTemplateParams {
  recordMap: RecordMap
  sourceBlockId: string,
  spaceId: string,
  targetBlockId: string
}

export interface InitializePageTemplateResult {
  recordMap: {
    block: BlockData
  }
}

export interface LoadBlockSubtreeParams {
  blockId: string,
  shallow: boolean
}

export interface LoadBlockSubtreeResult {
  subtreeRecordMap: {
    block: BlockData
  }
}

export interface GetSpacesResult {
  [k: string]: RecordMap
}

export interface GetGenericEmbedBlockDataParams {
  pageWidth: number,
  source: string,
  type: TGenericEmbedBlockType
}

export interface GetGenericEmbedBlockDataResult {
  format: MediaFormat,
  properties: {
    source: string[][]
  },
  type: TGenericEmbedBlockType
}

export interface GetUploadFileUrlParams {
  bucket: "secure",
  contentType: string,
  name: string
}

export interface GetUploadFileUrlResult {
  signedGetUrl: string,
  signedPutUrl: string,
  url: string
}

export interface SetBookmarkMetadataParams {
  blockId: string,
  url: string
}

export interface QueryCollectionParams {
  collectionId: string,
  collectionViewId: string,
  query: {
    filter?: IViewFilter,
    sort?: ViewSorts[],
    aggregations?: ViewAggregations[]
  },
  loader: {
    limit?: number,
    searchQuery?: string,
    type: 'table',
    loadContentCover: boolean
  }
}

export interface GetGoogleDriveAccountsResult {
  accounts: Account[]
}

export interface InitializeGoogleDriveBlockParams {
  blockId: string,
  fileId: string,
  token: Token
}

export interface InitializeGoogleDriveBlockResult {
  file: GoogleDriveFile,
  recordMap: {
    block: BlockData
  }
}

export interface SyncRecordValuesParams {
  id: string,
  table: TOperationTable,
  version: number
}

export interface InviteGuestsToSpaceParams {
  blockId: string,
  permissionItems: IPermission[],
  spaceId: string
}
export interface FindUserResult {
  value: {
    role: "reader",
    value: INotionUser
  }
}

export interface CreateSpaceParams {
  icon: string,
  initialUseCases: string[],
  name: string,
  planType: "personal"
}

export interface CreateSpaceResult {
  recordMap: {
    space: SpaceData
  },
  spaceId: string
}

export interface QueryCollectionResult {
  result: {
    aggregationResults: {
      type: "number",
      value: number
    }[],
    blockIds: string[],
    total: number,
    type: "table"
  }
  recordMap: Pick<RecordMap, "collection" | "space" | "collection_view" | "block">
}

export interface LoadUserContentResult {
  recordMap: Omit<RecordMap, "collection_view">
}

export interface GetUserSharePagesResult {
  pages: { id: string, spaceId: string }[],
  recordMap: {
    block: BlockData,
    space: SpaceData,
  }
}
export interface SyncRecordValuesResult {
  recordMap: RecordMap
}

export interface LoadPageChunkParams {
  chunkNumber: number,
  cursor: Cursor,
  limit: number,
  pageId: string,
  verticalColumns: boolean
}

export interface LoadPageChunkResult {
  cursor: Cursor,
  recordMap: RecordMap
}

export interface GetBackLinksForBlockResult {
  recordMap: {
    block: BlockData,
  }
}

export interface GetUserTasksResult {
  taskIds: string[]
}

export interface CollectionViewData {
  [key: string]: {
    role: TPermissionRole,
    value: ICollectionView
  }
};

export interface CollectionViewPageData {
  [key: string]: {
    role: TPermissionRole,
    value: ICollectionViewPage
  }
};

export interface BlockData {
  [key: string]: {
    role: TPermissionRole,
    value: TBlock
  }
}

export interface SpaceData {
  [key: string]: {
    role: TPermissionRole,
    value: ISpace
  }
}

export interface SpaceViewData {
  [key: string]: {
    role: TPermissionRole,
    value: ISpaceView
  }
}

export interface CollectionData {
  [key: string]: {
    role: TPermissionRole,
    value: ICollection
  }
}

export interface ViewData {
  [key: string]: {
    role: TPermissionRole,
    value: ITableView | IListView | IBoardView | ICalendarView | IGalleryView
  }
}

export interface NotionUserData {
  [key: string]: {
    role: TPermissionRole,
    value: INotionUser
  }
}

export interface UserRootData {
  [key: string]: {
    role: TPermissionRole,
    value: IUserRoot
  }
}

export interface UserSettingsData {
  [key: string]: {
    role: TPermissionRole,
    value: IUserSettings
  }
}

export interface ISpace extends CreateProps, LastEditedProps {
  beta_enabled: boolean,
  icon?: string,
  id: string,
  invite_link_code: string,
  invite_link_enabled: boolean,
  name: string,
  pages: string[],
  permissions: (ISpacePermission | IUserPermission)[],
  plan_type: TPlanType,
  shard_id: number,
  version: number,
  disable_public_access?: boolean,
  disable_guests?: boolean,
  disable_move_to_space?: boolean,
  disable_export?: boolean,
  domain?: string,
}

export interface ISpaceView extends Node {
  created_getting_started: boolean,
  created_onboarding_templates?: boolean,
  joined: boolean,
  notify_desktop: boolean,
  notify_email: boolean,
  notify_mobile: boolean,
  sidebar_hidden_templates?: string[],
  space_id: string,
  visited_templates?: string[],
  bookmarked_pages: string[],
}

export interface INotionUser {
  email: string,
  family_name: string,
  given_name: string,
  id: string,
  onboarding_completed: boolean,
  profile_photo: string,
  version: number
}

export interface IUserRoot {
  id: string,
  space_views: string[],
  version: number,
  left_spaces?: string[]
}

export interface IUserSettings {
  id: string,
  version: number,
  settings: IUserSettingsSettings,
  time_zone?: string,
  locale?: TLocale
  preferred_locale?: TLocale,
  preferred_locale_origin?: string,
  start_day_of_week?: number
}

export type TPersona = 'personal' | 'student'
export type TPreferredLocaleOrigin = "autodetect" | 'legacy'
export interface IUserSettingsSettings {
  locale: TLocale,
  persona: TPersona,
  preferred_locale: TLocale,
  preferred_locale_origin: TPreferredLocaleOrigin ,
  signup_time: number,
  start_day_of_week?: number,
  time_zone: string,
  type: "personal",
  used_desktop_web_app: boolean
}

export interface RecordMap {
  block: BlockData,
  collection: CollectionData,
  collection_view: ViewData,
  space: SpaceData,
  notion_user: NotionUserData,
  space_view: SpaceViewData,
  user_root: UserRootData,
  user_settings: UserSettingsData,
}