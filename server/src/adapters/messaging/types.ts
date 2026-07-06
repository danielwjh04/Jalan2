export interface OutboundResult {
  messageId: string;
}

export interface InboundMessage {
  from: string;
  text: string;
}

export interface MessagingProvider {
  readonly name: 'mock' | 'twilio' | 'telegram';
  sendBookingRequest(to: string, body: string): Promise<OutboundResult>;
}
