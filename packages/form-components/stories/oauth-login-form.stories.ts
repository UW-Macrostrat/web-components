import { Meta, StoryObj } from "@storybook/react-vite";
import { OAuthLoginForm, oauthProviders } from "../src";

export default {
  title: "Form components/OAuth login form",
  component: OAuthLoginForm,
  args: {
    onSubmit: (credentials) => console.log(credentials),
    providers: oauthProviders("https://example.org/auth"),
  },
} as Meta<typeof OAuthLoginForm>;

type Story = StoryObj<typeof OAuthLoginForm>;

export const Default: Story = {};

export const WithError: Story = {
  args: {
    error: "We couldn't complete the sign-in. Please try again.",
  },
};

export const CredentialsOnly: Story = {
  args: {
    providers: [],
  },
};
