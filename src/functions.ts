import {
  IConfig,
  IImpression,
  IPlayer,
  IPrebidAds,
  IResponseData,
} from "./types";
import config from "../renovi.config.js";
import { DeviceUUID } from "device-uuid";

const baseUrl: string = "https://api.dev.nexa.lumenspei.xyz/renovi";
let deviceId: string = "474747";
let sessionId: string;
let ip: string;
let locationData: Partial<IImpression>;

const validateConfig = (config: IConfig): string[] => {
  const errors = [];
  if (!config.apiKey) {
    errors.push("apiKey is required");
  }
  if (!config.email) {
    errors.push("email is required");
  }
  if (!config.gameId) {
    errors.push("gameId is required");
  }
  if (!config.panelNames) {
    errors.push("panelNames is required");
  }
  return errors;
};

const getIp = async (): Promise<string> => {
  try {
    const response = await fetch("https://ipinfo.io/ip");
    if (!response.ok) {
      throw new Error("Failed to fetch IP");
    }
    return response.text();
  } catch (error) {
    return Promise.reject(error);
  }
};

const getLocationDataFromIP = async (
  ip: string
): Promise<Partial<IImpression>> => {
  try {
    const response = await fetch(`https://ipinfo.io/${ip}/json`);
    if (!response.ok) {
      throw new Error("Failed to fetch location data");
    }
    const data = await response.json();
    return {
      country: data.country,
      city: data.city,
    };
  } catch (error) {
    return Promise.reject(error);
  }
};

const login = async (): Promise<string> => {
  const uuid = new DeviceUUID().get();

  try {
    const fetchBody: IPlayer = {
      deviceId: uuid,
      gameId: config.gameId,
      country: "OTHER",
    };
    const response = await fetch(`${baseUrl}/v1/active-players/create`, {
      method: "POST",
      body: JSON.stringify(fetchBody),
      headers: {
        "Content-Type": "application/json",
        Key: config.apiKey,
        Email: config.email,
      },
    });

    if (!response.ok) {
      console.error(await response.json());
      throw new Error("Failed to login");
    }
    return ((await response.json()) as IResponseData).data;
  } catch (error) {
    console.error(error);
    return "";
  }
};

const setup = async (config: IConfig): Promise<boolean> => {
  try {
    const configErrors: string[] = validateConfig(config);
    if (configErrors.length > 0) {
      throw new Error(configErrors.join(", "));
    }
    sessionId = await login();
    if (sessionId === "") {
      console.error("Nesto ovde smrducka!");
    }
    const campaigns: IPrebidAds[] = await getCampaigns();
    ip = await getIp();
    locationData = await getLocationDataFromIP(ip);
    await view(campaigns[0].panelName, campaigns[0].campaigns[0].viewUrl);

    return Promise.resolve(true);
  } catch (error) {
    return Promise.reject(false);
  }
};

export const getCampaigns = async (): Promise<IPrebidAds[]> => {
  try {
    const panelsString: string =
      config.panelNames.length > 0
        ? `&panels=${config.panelNames.join("~")}`
        : "";
    const url: string = `${baseUrl}/v1/engine/prebid-ads?gameId=${config.gameId}&sessionId=${sessionId}${panelsString}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Key: config.apiKey,
        Email: config.email,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch ads...");
    }
    const responseData: IResponseData = await response.json();
    return Promise.resolve(responseData.data);
  } catch (error) {
    return Promise.reject(error);
  }
};

export const view = async (
  panelName: string,
  viewUrl: string
): Promise<void> => {
  try {
    const url = `${baseUrl}/v1/impressions/create-programmatic`;
    const requestBody: IImpression = {
      panelName: panelName,
      deviceId: deviceId,
      sessionId: sessionId,
      dwell: 60,
      url: viewUrl,
      gameId: config.gameId,
      city: locationData.city!,
      country: locationData.country!,
    };
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
        Key: config.apiKey,
        Email: config.email,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to register impression");
    }

    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
};

export const init = async (config: IConfig): Promise<boolean> => {
  const setupResolved = await setup(config);

  return setupResolved;
};
