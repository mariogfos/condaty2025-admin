export type SendMessageType = (
  text: string,
  roomId: string,
  file?: File
) => any;

export type SendEmoticonType = (emoticon: string, msgId: string) => any;
