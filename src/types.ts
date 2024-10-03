export interface ILogin {
  firstName: string;
  lastName?: string;
  age?: number;
}

export interface ISetup {
  firstName: string;
  lastName?: string;
  age?: number;
}

export interface IConfig {
  apiKey: string;
  email: string;
  gameId: string;
  panelNames: string[];
  prod?: boolean;
}

export interface IPlayer {
  deviceId?: string;
  gameId?: string;
  country?: string;
  date?: Date;
  count?: number;
  views?: string[];
}

export interface IImpression {
  panelName: string;
  gameId: string;
  deviceId: string;
  walletAddress?: string;
  dwell: number;
  city: string;
  country: string;
  sessionId: string;
  url: string;
}

export interface IPrebidAds {
  panelName: string;
  campaigns: ICampaigns[];
}

export interface ISLide {
  id: string;
  duration?: number;
  position?: number;
  imagePath?: string;
  backgroundColor?: string;
}

export interface ICampaigns {
  imagePath: string;
  winUrl: string;
  viewUrl: string;
  slide: ISLide;
}

export interface IResponseData {
  data: any;
}

export interface IPrebidSlides {
  id: string;
  duration: number;
  position: number;
  imagePath: string;
  backgroundColor: string;
}

export interface IPrebidCampaign {
  id: string;
  layoutEnum: string;
  slides: IPrebidSlides[];
}

export interface IPrebidPanel {
  panelName: string;
  campaigns: IPrebidCampaign[];
}

export interface IPrebidResponseData {
  data: IPrebidPanel[];
}
