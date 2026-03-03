export interface CustomerProfile {
  readonly id: string
  readonly name: string
  readonly document: string
  readonly companyName: string
  readonly segment: CustomerSegment
  readonly accountStatus: AccountStatus
  readonly relationshipSince: string
  readonly creditScore?: number
}

export type CustomerSegment = 'micro' | 'small' | 'medium' | 'corporate'
export type AccountStatus = 'active' | 'restricted' | 'blocked'
