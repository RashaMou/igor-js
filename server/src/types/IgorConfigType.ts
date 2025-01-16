export interface IgorConfig {
  channels: ChannelConfig;
  reactors: ReactorConfig;
}

export type ChannelConfig = {
  class: string;
  [key: string]: any;
};

export type ReactorConfig = {
  class: string;
  [key: string]: any;
};
