import ContextMenuElement from "./ContextMenuElement";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

interface MemberMenuProps {
	uid: string;
}

const MemberMenu: React.FC<MemberMenuProps> = ({ uid }) => (
	<ContextMenuElement onClick={(_) => navigator.clipboard.writeText(uid)}>
		<ContentCopyIcon />
		Copy User ID
	</ContextMenuElement>
);

export default MemberMenu;
