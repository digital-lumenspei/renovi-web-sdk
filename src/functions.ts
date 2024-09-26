import {
  IConfig,
  IImpression,
  IPlayer,
  IPrebidAds,
  IResponseData,
} from "./types";
import { DeviceUUID } from "device-uuid";

let config: IConfig;
let baseUrl: string = "https://api.dev.nexa.lumenspei.xyz/renovi";
let deviceId: string = "";
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
  const id = new DeviceUUID().get();

  try {
    const fetchBody: IPlayer = {
      deviceId: id,
      gameId: config.gameId,
      country: locationData.country || "OTHER",
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
    deviceId = id;
    return ((await response.json()) as IResponseData).data;
  } catch (error) {
    console.error(error);
    return "";
  }
};

const setup = async (): Promise<boolean> => {
  try {
    const configErrors: string[] = validateConfig(config);
    if (configErrors.length > 0) {
      throw new Error(configErrors.join(", "));
    }
    if (config.prod) {
      baseUrl = "https://api.renovi.io/renovi";
    }

    ip = await getIp();
    locationData = await getLocationDataFromIP(ip);
    sessionId = await login();

    if (sessionId === "") {
      console.error("session id is required");
    }

    return Promise.resolve(true);
  } catch (error) {
    return Promise.reject(false);
  }
};

export const getCampaigns = async (): Promise<{ [key: string]: string }> => {
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
    const campaignsData: IPrebidAds[] = responseData.data;

    const result: { [key: string]: string } = {};

    campaignsData.forEach((campaign) => {
      let html = `<div class="renovi-container" id="container-${campaign.panelName}" data-panel-name="${campaign.panelName}" data-view-url="${campaign.campaigns[0].viewUrl}">`;
      if (campaign.campaigns.length > 1) {
        html += `
          <div class="renovi-slider" id="slider-${campaign.panelName}">
            ${campaign.campaigns
              .map(
                (c, index) => `
              <div class="slide ${index === 0 ? "active" : ""}" id="slide-${
                  c.slide.id
                }">
                <img src="${c.imagePath}" alt="Campaign Image">
              </div>
            `
              )
              .join("")}
          </div>
        `;
      } else {
        html += `
          <div class="campaign-single">
            <img src="${campaign.campaigns[0].imagePath}" alt="Campaign Image">
          </div>
        `;
      }
      html += "</div>";
      result[campaign.panelName] = html;
    });

    return Promise.resolve(result);
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

export const init = async (cfg: IConfig): Promise<boolean> => {
  config = cfg;
  const setupSuccessful = await setup();

  if (setupSuccessful) {
    document.addEventListener("campaignInView", function (event) {
      const customEvent = event as CustomEvent<{
        panelName: string;
        viewUrl: string;
      }>;
      const { panelName, viewUrl } = customEvent.detail;
      view(panelName, viewUrl);
    });

    // Set up sliders and observers
    setupSliders();
    setupIntersectionObservers();
    setupMutationObserver();
  }
  return setupSuccessful;
};

const setupSliders = () => {
  const sliders = document.querySelectorAll(".renovi-slider");
  sliders.forEach((slider) => {
    setupSlider(slider as HTMLElement);
  });
};

const setupSlider = (sliderElement: HTMLElement) => {
  let currentIndex = 0;
  const slides = sliderElement.querySelectorAll(".slide");

  setInterval(() => {
    slides[currentIndex].classList.remove("active");
    currentIndex = (currentIndex + 1) % slides.length;
    slides[currentIndex].classList.add("active");
  }, 3000);
};

const setupIntersectionObservers = () => {
  const containers = document.querySelectorAll(".renovi-container");
  containers.forEach((container) => {
    setupIntersectionObserver(container as HTMLElement);
  });
};

const setupIntersectionObserver = (container: HTMLElement) => {
  const options = {
    root: null,
    rootMargin: "0px",
    threshold: 0.5,
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const panelName = container.getAttribute("data-panel-name");
        const viewUrl = container.getAttribute("data-view-url");

        if (panelName && viewUrl) {
          // Dispatch custom event
          const event = new CustomEvent("campaignInView", {
            detail: {
              panelName: panelName,
              viewUrl: viewUrl,
            },
          });
          document.dispatchEvent(event);
        }
        observer.unobserve(container);
      }
    });
  }, options);

  observer.observe(container);
};

const setupMutationObserver = () => {
  const observer = new MutationObserver((mutationsList) => {
    for (let mutation of mutationsList) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.classList.contains("renovi-container")) {
              setupIntersectionObserver(node);
            }

            if (node.classList.contains("renovi-slider")) {
              setupSlider(node);
            } else {
              const sliders = node.querySelectorAll(".renovi-slider");
              sliders.forEach((slider) => {
                setupSlider(slider as HTMLElement);
              });
            }
          }
        });
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
};
