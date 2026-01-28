import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
	appId: 'com.tjpubls.app',
	appName: 'TJPubls',
	webDir: 'dist',
	server: {
		androidScheme: 'https',
		url: 'http://localhost:5173',
		cleartext: true
	},
	plugins: {
		SQLite: {
			iosDatabaseLocation: 'Library/CapacitorDatabase',
			iosIsEncryption: false,
			androidIsEncryption: false,
			electronIsEncryption: false
		}
	}
}

export default config
