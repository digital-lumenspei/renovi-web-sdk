# Renovi Utility Functions

Renovi Utility Functions is an npm package that provides a set of utility functions for interacting with the Renovi API. This package includes functions for fetching campaigns, registering impressions, and initializing the package with a configuration object.

## Installation

To install the package, run:

```
npm install renovi-utils
```

## Usage

To use this package, you need to provide a configuration object when initializing it. The configuration object should have the following structure:

```
interface IConfig {
apiKey: string;
email: string;
gameId: string;
panelNames: string[];
}
```

## Example

Here is an example of how to use the package:

```
import { initialize, getCampaigns, view } from 'renovi-utils';

const config = {
apiKey: 'your-api-key',
email: 'your-email@example.com',
gameId: 'your-game-id',
panelNames: ['Panel 1', 'Panel 2'],
};

initialize(config).then(() => {
console.log('Package initialized successfully');
```

Fetch campaigns

```
   getCampaigns().then((campaigns) => {
       console.log('Campaigns:', campaigns);
   }).catch((error) => {
       console.error('Failed to fetch campaigns:', error);
   });
```

Register an impression

```
   view('Panel 1', 'https://example.com/view').then(() => {
       console.log('Impression registered successfully');
   }).catch((error) => {
       console.error('Failed to register impression:', error);
   });

}).catch((error) => {
console.error('Failed to initialize package:', error);
});
```

## Functions

`init(config: IConfig): Promise<void>`

Initializes the package with the provided configuration object. This function must be called before using any other functions in the package.

`getCampaigns(): Promise<IPrebidAds[]>`

Fetches the list of campaigns from the Renovi API.

`view(panelName: string, viewUrl: string): Promise<void>`

Registers an impression for the specified panel and URL.

## Types

`IConfig`

The configuration object used to initialize the package.

```
interface IConfig {
    apiKey: string;
    email: string;
    gameId: string;
    panelNames: string[];
}
```

## Development

To build the package, run:

`npm run build`

To start the package, run:

`npm run start`

## License

This project is licensed under the MIT License.
