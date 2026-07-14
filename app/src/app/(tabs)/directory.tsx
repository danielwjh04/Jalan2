import { Redirect } from "expo-router";

export default function DirectoryRedirect(): React.ReactElement {
  return <Redirect href="/discover?section=operators" />;
}
