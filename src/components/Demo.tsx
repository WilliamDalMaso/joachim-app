import { AIChatInput } from "./AIChatInput"

const Demo = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold text-white">AI Chat Input Demo</h1>
                    <p className="text-gray-400 text-lg">Advanced chat input with animations and features</p>
                </div>
                
                <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                    <AIChatInput/>
                </div>
                
                <div className="text-center text-gray-500 text-sm">
                    <p>Features: Animated placeholders, expanding input, voice recording, file uploads, and more!</p>
                </div>
            </div>
        </div>
    )
}

export {Demo} 