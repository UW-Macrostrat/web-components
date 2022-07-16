import React from "react";
import {
  TextInput,
  Text,
  PasswordInput,
  Button,
  Box,
  Group,
  Modal,
  Anchor,
} from "@mantine/core";
import { useForm } from "@mantine/hooks";
import { Icon } from "@blueprintjs/core";

interface AuthFormI {
  onSubmit: (e: any) => void;
  error: string | null;
}

export type Credentials = { username: string; password: string };
export type UserInfo = Credentials & {
  firstName: string;
  lastName: string;
  confirmPassword: string;
};

function LoginForm({ onSubmit, error }: AuthFormI) {
  const form = useForm<Credentials>({
    initialValues: {
      username: "",
      password: "",
    },
  });

  return (
    <Box sx={{ maxWidth: 400 }} mx="auto">
      <form onSubmit={form.onSubmit((values) => onSubmit(values))}>
        <TextInput
          icon={<Icon icon="user" />}
          mt="sm"
          required
          label="Username"
          placeholder="Choose a username"
          {...form.getInputProps("username")}
        />
        <PasswordInput
          icon={<Icon icon="lock" />}
          mt="sm"
          label="Password"
          placeholder="Password"
          {...form.getInputProps("password")}
        />

        {error && (
          <Text color="red" size="sm" mt="sm">
            {error}
          </Text>
        )}

        <Group position="right" mt="md">
          <Button type="submit">Login</Button>
        </Group>
      </form>
    </Box>
  );
}

function Register({ onSubmit, error }: AuthFormI) {
  const form = useForm<UserInfo>({
    initialValues: {
      firstName: "",
      lastName: "",
      username: "",
      password: "",
      confirmPassword: "",
    },

    validationRules: {
      password: (value) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(value),
      confirmPassword: (value, values) => value == values?.password,
    },
    errorMessages: {
      password:
        "Password should contain 1 number, 1 letter and at least 6 characters",
      confirmPassword: "Passwords do not match",
    },
  });

  return (
    <Box sx={{ maxWidth: 400 }} mx="auto">
      <form onSubmit={form.onSubmit((values) => onSubmit(values))}>
        <Group direction="row" position="apart">
          <TextInput
            mt="sm"
            required
            label="First Name"
            placeholder="Your first name"
            {...form.getInputProps("firstName")}
          />
          <TextInput
            mt="sm"
            required
            label="Last Name"
            placeholder="Your first name"
            {...form.getInputProps("lastName")}
          />
        </Group>
        <TextInput
          icon={<Icon icon="user" />}
          mt="sm"
          required
          label="Username"
          placeholder="Choose a username"
          {...form.getInputProps("username")}
        />
        <PasswordInput
          icon={<Icon icon="lock" />}
          mt="sm"
          label="Password"
          placeholder="Password"
          {...form.getInputProps("password")}
        />

        <PasswordInput
          mt="sm"
          icon={<Icon icon="lock" />}
          label="Confirm password"
          placeholder="Confirm password"
          {...form.getInputProps("confirmPassword")}
        />
        {error && (
          <Text color="red" size="sm" mt="sm">
            {error}
          </Text>
        )}
        <Group position="right" mt="md">
          <Button type="submit">Register</Button>
        </Group>
      </form>
    </Box>
  );
}

export { LoginForm, Register };
