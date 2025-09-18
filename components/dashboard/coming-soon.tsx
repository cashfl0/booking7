interface ComingSoonProps {
  title: string
  description: string
  icon?: React.ReactNode
}

export function ComingSoon({ title, description, icon }: ComingSoonProps) {
  return (
    <div className="p-8">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-6">
          {icon && (
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                {icon}
              </div>
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600">{description}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <div className="text-4xl mb-4">🚧</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h2>
          <p className="text-sm text-gray-500">
            This feature is currently under development and will be available soon.
          </p>
        </div>
      </div>
    </div>
  )
}