import UploadForm from "./_components/upload-form";
import UploadList from "./_components/upload-list";

export default function UploadPage() {
	return (
		<div className="flex flex-col max-w-2xl mx-auto gap-8">
			<UploadForm />
			<UploadList />
		</div>
	);
}
